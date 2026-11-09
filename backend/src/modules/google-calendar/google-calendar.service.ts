import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { calendar_v3, calendar } from '@googleapis/calendar';
import { OAuth2Client } from 'google-auth-library';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';
import { ScheduleStatus } from 'src/common/consts/schedule.status';
import { CryptoService } from 'src/common/crypto/crypto.service';
import { redisKey } from 'src/common/redis/redis-keys';
import { Schedule } from 'src/common/models';
import { Utils } from 'src/common/utils/utils';
import { GoogleCalendarRepository } from './repositories/google-calendar.repository';
import { GoogleCalendarCallbackDTO } from './validation/google-calendar-callback.DTO';

const GOOGLE_CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
];
const OAUTH_STATE_TTL_SECONDS = 600;
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

@Injectable()
export class GoogleCalendarService {
    constructor(
        private readonly configService: ConfigService,
        private readonly cryptoService: CryptoService,
        private readonly googleCalendarRepository: GoogleCalendarRepository,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) {}

    logger = new Logger(GoogleCalendarService.name);

    async getConnectUrl(professional_id: number) {
        try {
            const state = crypto.randomBytes(32).toString('hex');
            await this.redis.setex(
                redisKey(
                    this.configService.get<string>('SITE_ID'),
                    'google_oauth_state',
                    state,
                ),
                OAUTH_STATE_TTL_SECONDS,
                String(professional_id),
            );

            const url = this.createOAuthClient().generateAuthUrl({
                access_type: 'offline',
                prompt: 'consent',
                scope: GOOGLE_CALENDAR_SCOPES,
                state,
            });

            return { url };
        } catch (error) {
            Utils.logError(
                this.logger,
                'Failed to create Google connect URL',
                error,
            );
            Utils.handleError(error);
        }
    }

    async handleCallback(dto: GoogleCalendarCallbackDTO) {
        try {
            const stateKey = redisKey(
                this.configService.get<string>('SITE_ID'),
                'google_oauth_state',
                dto.state,
            );
            const professional_id = await this.redis.get(stateKey);
            if (!professional_id) {
                throw new UnauthorizedException(
                    'State inválido ou expirado. Gere um novo link em /google-calendar/connect',
                );
            }
            await this.redis.del(stateKey);

            if (dto.error || !dto.code) {
                throw new BadRequestException(
                    `Acesso à agenda não autorizado: ${dto.error ?? 'código ausente'}`,
                );
            }

            const { tokens } = await this.createOAuthClient().getToken(
                dto.code,
            );
            if (!tokens.refresh_token) {
                throw new BadRequestException(
                    'O Google não devolveu o refresh token. Remova o acesso do app na sua conta Google e conecte novamente',
                );
            }

            await this.googleCalendarRepository.saveConnection(
                Number(professional_id),
                this.cryptoService.encrypt(tokens.refresh_token),
            );
            this.logger.log(
                `Agenda Google conectada (profissional ${professional_id})`,
            );

            return { message: 'Agenda Google conectada com sucesso' };
        } catch (error) {
            Utils.logError(
                this.logger,
                'Failed to handle Google callback',
                error,
            );
            Utils.handleError(error);
        }
    }

    async getStatus() {
        try {
            const admin =
                await this.googleCalendarRepository.findConnectedAdmin();
            return {
                connected: !!admin,
                professional_id: admin?.id ?? null,
                calendar_id: admin?.google_calendar_id ?? null,
            };
        } catch (error) {
            Utils.logError(this.logger, 'Failed to get Google status', error);
            Utils.handleError(error);
        }
    }

    async disconnect() {
        try {
            const admin =
                await this.googleCalendarRepository.findConnectedAdmin();
            if (!admin) {
                throw new NotFoundException('Nenhuma agenda Google conectada');
            }

            try {
                await this.createOAuthClient().revokeToken(
                    this.cryptoService.decrypt(admin.google_refresh_token!),
                );
            } catch (error) {
                this.logger.warn(`Failed to revoke Google token: ${error}`);
            }

            await this.googleCalendarRepository.clearConnection(admin.id);
            this.logger.log(
                `Agenda Google desconectada (profissional ${admin.id})`,
            );
            return { message: 'Agenda Google desconectada com sucesso' };
        } catch (error) {
            Utils.logError(this.logger, 'Failed to disconnect Google', error);
            Utils.handleError(error);
        }
    }

    async syncSchedule(schedule_id: number): Promise<boolean> {
        try {
            const connection = await this.getCalendarConnection();
            if (!connection) {
                this.logger.debug(
                    `Sincronização ignorada: nenhuma agenda conectada (agendamento ${schedule_id})`,
                );
                return false;
            }
            return await this.syncScheduleWithConnection(
                schedule_id,
                connection,
            );
        } catch (error) {
            Utils.logError(
                this.logger,
                `Failed to sync schedule ${schedule_id} with Google`,
                error,
            );
            return false;
        }
    }

    async syncSchedules(schedule_id?: number) {
        try {
            const connection = await this.getCalendarConnection();
            if (!connection) {
                return { connected: false, synced: 0, failed: 0 };
            }

            const ids = schedule_id
                ? [schedule_id]
                : await this.googleCalendarRepository.findAllScheduleIds();
            let synced = 0;
            let failed = 0;

            for (const id of ids) {
                const ok = await this.syncScheduleWithConnection(
                    id,
                    connection,
                );
                if (ok) synced += 1;
                else failed += 1;
            }

            return { connected: true, synced, failed };
        } catch (error) {
            Utils.logError(
                this.logger,
                'Failed to sync schedules with Google',
                error,
            );
            Utils.handleError(error);
        }
    }

    private async syncScheduleWithConnection(
        schedule_id: number,
        connection: { client: calendar_v3.Calendar; calendarId: string },
    ): Promise<boolean> {
        const schedule =
            await this.googleCalendarRepository.findScheduleForSync(
                schedule_id,
            );
        if (!schedule) return false;

        if (
            schedule.status === ScheduleStatus.CANCELED &&
            !schedule.google_event_id
        ) {
            return true;
        }

        const requestBody = await this.buildEvent(schedule);

        if (schedule.google_event_id) {
            try {
                const { data } = await connection.client.events.update({
                    calendarId: connection.calendarId,
                    eventId: schedule.google_event_id,
                    requestBody,
                });
                await this.googleCalendarRepository.saveEventMetadata(
                    schedule.id,
                    data.id ?? schedule.google_event_id,
                    data.htmlLink ?? schedule.google_event_link,
                );
                this.logger.log(
                    `Evento atualizado no Google (agendamento ${schedule.id}, evento ${data.id ?? schedule.google_event_id})`,
                );
                return true;
            } catch (error) {
                if (!this.isEventGone(error)) throw error;
                this.logger.warn(
                    `Evento ${schedule.google_event_id} não existe mais no Google; criando outro (agendamento ${schedule.id})`,
                );
            }
        }

        const { data } = await connection.client.events.insert({
            calendarId: connection.calendarId,
            requestBody,
        });
        await this.googleCalendarRepository.saveEventMetadata(
            schedule.id,
            data.id ?? null,
            data.htmlLink ?? null,
        );
        this.logger.log(
            `Evento criado no Google (agendamento ${schedule.id}, evento ${data.id})`,
        );
        return true;
    }

    async deleteScheduleEvent(google_event_id: string | null): Promise<void> {
        try {
            if (!google_event_id) return;
            const connection = await this.getCalendarConnection();
            if (!connection) return;
            await this.removeEvent(connection, google_event_id);
            this.logger.log(
                `Evento removido do Google (evento ${google_event_id})`,
            );
        } catch (error) {
            Utils.logError(
                this.logger,
                `Failed to delete Google event ${google_event_id}`,
                error,
            );
        }
    }

    private async buildEvent(
        schedule: Schedule,
    ): Promise<calendar_v3.Schema$Event> {
        const [client, professional] = await Promise.all([
            this.googleCalendarRepository.findClientWithUser(
                schedule.client_id,
            ),
            this.googleCalendarRepository.findProfessionalWithUser(
                schedule.professional_id,
            ),
        ]);

        const { procedure } = schedule;
        const clientName =
            client?.user?.name ?? `Cliente ${schedule.client_id}`;
        const professionalName =
            professional?.user?.name ??
            `Profissional ${schedule.professional_id}`;
        const duration =
            schedule.session === 0
                ? procedure.triagem_minutes
                : procedure.duration_minutes;
        const timeZone =
            this.configService.get<string>('GOOGLE_CALENDAR_TIMEZONE') ??
            DEFAULT_TIMEZONE;
        const canceled = schedule.status === ScheduleStatus.CANCELED;

        return {
            summary: `${canceled ? '[CANCELADO] ' : ''}${professionalName} · ${clientName} · ${procedure.name}`,
            description: [
                `Profissional: ${professionalName}`,
                `Cliente: ${clientName}`,
                `Telefone do cliente: ${client?.user?.phone_number ?? '-'}`,
                `Procedimento: ${procedure.name}`,
                `Agendamento #${schedule.id}`,
                `Status: ${this.statusLabel(schedule.status)}`,
            ].join('\n'),
            colorId: this.colorIdForStatus(schedule.status),
            start: {
                dateTime: this.toLocalDateTime(
                    schedule.date,
                    schedule.start_time,
                    0,
                ),
                timeZone,
            },
            end: {
                dateTime: this.toLocalDateTime(
                    schedule.date,
                    schedule.start_time,
                    duration,
                ),
                timeZone,
            },
        };
    }

    private statusLabel(status: string): string {
        if (status === ScheduleStatus.COMPLETED) return 'Concluído';
        if (status === ScheduleStatus.CANCELED) return 'Cancelado';
        if (status === ScheduleStatus.ABSENT) return 'Ausente';
        return 'Confirmado';
    }

    private colorIdForStatus(status: string): string {
        if (status === ScheduleStatus.COMPLETED) return '2';
        if (status === ScheduleStatus.ABSENT) return '6';
        if (status === ScheduleStatus.CANCELED) return '8';
        return '9';
    }

    private toLocalDateTime(
        date: string,
        time: string,
        plusMinutes: number,
    ): string {
        const base = new Date(`${date}T${time}:00Z`);
        base.setUTCMinutes(base.getUTCMinutes() + plusMinutes);
        return base.toISOString().slice(0, 19);
    }

    private async getCalendarConnection(): Promise<{
        client: calendar_v3.Calendar;
        calendarId: string;
    } | null> {
        const admin = await this.googleCalendarRepository.findConnectedAdmin();
        if (!admin) return null;

        const auth = this.createOAuthClient();
        auth.setCredentials({
            refresh_token: this.cryptoService.decrypt(
                admin.google_refresh_token!,
            ),
        });

        return {
            client: calendar({ version: 'v3', auth }),
            calendarId: admin.google_calendar_id,
        };
    }

    private async removeEvent(
        connection: { client: calendar_v3.Calendar; calendarId: string },
        google_event_id: string | null,
    ): Promise<void> {
        if (!google_event_id) return;
        try {
            await connection.client.events.delete({
                calendarId: connection.calendarId,
                eventId: google_event_id,
            });
        } catch (error) {
            if (!this.isEventGone(error)) throw error;
        }
    }

    private isEventGone(error: unknown): boolean {
        const status = (error as { status?: number })?.status;
        return status === 404 || status === 410;
    }

    private createOAuthClient(): OAuth2Client {
        return new OAuth2Client({
            clientId: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
            clientSecret: this.configService.getOrThrow<string>(
                'GOOGLE_CLIENT_SECRET',
            ),
            redirectUri: this.configService.getOrThrow<string>(
                'GOOGLE_REDIRECT_URI',
            ),
        });
    }
}
