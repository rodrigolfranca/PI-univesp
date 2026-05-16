import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ScheduleExceptionType } from 'src/common/models/schedule-exceptions.model';
import { Utils } from 'src/common/utils/utils';
import { ScheduleExceptionsRepository } from '../repositories/schedule-exceptions.repository';
import { ScheduleRepository } from '../repositories/schedules.repository';
import { WorkScheduleRepository } from '../repositories/work-schedules.repository';
import { ScheduleExceptionCreateDto } from '../validation/schedule-exception-create.DTO';
import { ScheduleExceptionGetAllDto } from '../validation/schedule-exception-get-all.DTO';
import { ScheduleExceptionUpdateDto } from '../validation/schedule-exception-update.DTO';

@Injectable()
export class ScheduleExceptionsService {
    constructor(
        private readonly scheduleExceptionsRepository: ScheduleExceptionsRepository,
        private readonly workScheduleRepository: WorkScheduleRepository,
        private readonly scheduleRepository: ScheduleRepository,
    ) {}

    logger = new Logger(ScheduleExceptionsService.name);

    async create(dto: ScheduleExceptionCreateDto) {
        try {
            await this.validateException(
                dto.professional_id,
                dto.date,
                dto.type,
                dto.start_time ?? null,
                dto.end_time ?? null,
            );
            return await this.scheduleExceptionsRepository.create(dto);
        } catch (error) {
            this.logger.error(`Failed to create schedule exception: ${error}`);
            Utils.handleError(error);
        }
    }

    async getAll(dto: ScheduleExceptionGetAllDto) {
        try {
            return await this.scheduleExceptionsRepository.findByFilters(dto);
        } catch (error) {
            this.logger.error(`Failed to get schedule exceptions: ${error}`);
            Utils.handleError(error);
        }
    }

    async update(id: number, dto: ScheduleExceptionUpdateDto) {
        try {
            const existing =
                await this.scheduleExceptionsRepository.findById(id);
            if (!existing)
                throw new NotFoundException(
                    `Exceção de agenda com ID ${id} não encontrada`,
                );

            await this.validateException(
                dto.professional_id ?? existing.professional_id,
                dto.date ?? existing.date,
                dto.type ?? existing.type,
                dto.start_time !== undefined
                    ? dto.start_time
                    : existing.start_time,
                dto.end_time !== undefined ? dto.end_time : existing.end_time,
            );

            return await this.scheduleExceptionsRepository.update(id, dto);
        } catch (error) {
            this.logger.error(`Failed to update schedule exception: ${error}`);
            Utils.handleError(error);
        }
    }

    async delete(id: number) {
        try {
            return await this.scheduleExceptionsRepository.delete(id);
        } catch (error) {
            this.logger.error(`Failed to delete schedule exception: ${error}`);
            Utils.handleError(error);
        }
    }

    async findExceptionsForDate(professional_id: number, date: string) {
        return this.scheduleExceptionsRepository.findExceptionsForDate(
            professional_id,
            date,
        );
    }

    private async validateException(
        professional_id: number,
        date: string,
        type: string,
        start_time: string | null,
        end_time: string | null,
    ) {
        const day_of_week = new Date(date + 'T00:00:00Z').getUTCDay();
        const workSchedules =
            await this.workScheduleRepository.findForProfessionalDay(
                professional_id,
                day_of_week,
            );

        if (type === ScheduleExceptionType.OPEN) {
            if (start_time && end_time) {
                const startMin = this.timeToMinutes(start_time);
                const endMin = this.timeToMinutes(end_time);
                const overlapsWS = workSchedules.some((ws) => {
                    const wsStart = this.timeToMinutes(ws.start_time);
                    const wsEnd = this.timeToMinutes(ws.end_time);
                    return startMin < wsEnd && endMin > wsStart;
                });
                if (overlapsWS) {
                    throw new ConflictException(
                        'Exceção do tipo "open" deve estar fora do horário de trabalho cadastrado',
                    );
                }
            } else {
                if (workSchedules.length > 0) {
                    throw new ConflictException(
                        'Exceção do tipo "open" para o dia inteiro não pode ser criada quando já existe horário de trabalho para esse dia',
                    );
                }
            }
        } else if (type === ScheduleExceptionType.BLOCKED) {
            if (start_time && end_time) {
                const startMin = this.timeToMinutes(start_time);
                const endMin = this.timeToMinutes(end_time);

                const isCovered = workSchedules.some((ws) => {
                    const wsStart = this.timeToMinutes(ws.start_time);
                    const wsEnd = this.timeToMinutes(ws.end_time);
                    return wsStart <= startMin && wsEnd >= endMin;
                });
                if (!isCovered) {
                    throw new ConflictException(
                        'Exceção do tipo "blocked" deve cobrir integralmente um horário de trabalho existente',
                    );
                }

                const booked = await this.scheduleRepository.findOverlapping(
                    professional_id,
                    date,
                    startMin,
                    endMin,
                );
                if (booked.length > 0) {
                    throw new ConflictException(
                        'Não é possível bloquear um horário que já possui agendamentos',
                    );
                }
            } else {
                if (workSchedules.length === 0) {
                    throw new ConflictException(
                        'Exceção do tipo "blocked" para o dia inteiro requer horário de trabalho cadastrado para esse dia',
                    );
                }

                const booked =
                    await this.scheduleRepository.findSchedulesForDate(
                        professional_id,
                        date,
                    );
                if (booked.length > 0) {
                    throw new ConflictException(
                        'Não é possível bloquear o dia inteiro quando há agendamentos existentes',
                    );
                }
            }
        }
    }

    private timeToMinutes(time: string): number {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }
}
