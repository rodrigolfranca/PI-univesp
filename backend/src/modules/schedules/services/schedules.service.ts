import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { Procedure, Schedule } from 'src/common/models';
import { ScheduleExceptionType } from 'src/common/models/schedule-exceptions.model';
import { Utils } from 'src/common/utils/utils';
import { UsersService } from 'src/modules/users/users.service';
import { ScheduleExceptionsRepository } from '../repositories/schedule-exceptions.repository';
import { ScheduleRepository } from '../repositories/schedules.repository';
import { WorkScheduleRepository } from '../repositories/work-schedules.repository';
import { ScheduleCreateDto } from '../validation/schedule-create.DTO';
import { ScheduleGetAllDto } from '../validation/schedule-get-all.DTO';
import { ScheduleUpdateDto } from '../validation/schedule-update.DTO';

@Injectable()
export class SchedulesService {
    constructor(
        private readonly scheduleRepository: ScheduleRepository,
        private readonly workScheduleRepository: WorkScheduleRepository,
        private readonly scheduleExceptionsRepository: ScheduleExceptionsRepository,
        private readonly usersService: UsersService,
    ) {}

    logger = new Logger(SchedulesService.name);

    async create(dto: ScheduleCreateDto) {
        try {
            await this.validateSlot(
                dto.professional_id,
                dto.date,
                dto.start_time,
                dto.session,
                dto.procedure_id,
            );
            return await this.scheduleRepository.create(dto);
        } catch (error) {
            this.logger.error(`Failed to create schedule: ${error}`);
            Utils.handleError(error);
        }
    }

    async getAll(dto: ScheduleGetAllDto) {
        try {
            return await this.scheduleRepository.findByFilters(dto);
        } catch (error) {
            this.logger.error(`Failed to get schedules: ${error}`);
            Utils.handleError(error);
        }
    }

    async update(id: number, dto: ScheduleUpdateDto) {
        try {
            const existing = await this.scheduleRepository.findById(id);
            if (!existing)
                throw new NotFoundException(
                    `Agendamento com ID ${id} não encontrado`,
                );

            const timingChanged =
                dto.professional_id !== undefined ||
                dto.date !== undefined ||
                dto.start_time !== undefined ||
                dto.session !== undefined ||
                dto.procedure_id !== undefined;

            if (timingChanged) {
                await this.validateSlot(
                    dto.professional_id ?? existing.professional_id,
                    dto.date ?? existing.date,
                    dto.start_time ?? existing.start_time,
                    dto.session ?? existing.session,
                    dto.procedure_id ?? existing.procedure_id,
                    id,
                );
            }

            return await this.scheduleRepository.update(id, dto);
        } catch (error) {
            this.logger.error(`Failed to update schedule: ${error}`);
            Utils.handleError(error);
        }
    }

    async delete(id: number) {
        try {
            return await this.scheduleRepository.delete(id);
        } catch (error) {
            this.logger.error(`Failed to delete schedule: ${error}`);
            Utils.handleError(error);
        }
    }

    async findSchedulesForDate(
        professional_id: number,
        date: string,
    ): Promise<Schedule[]> {
        return this.scheduleRepository.findSchedulesForDate(
            professional_id,
            date,
        );
    }

    private async validateSlot(
        professional_id: number,
        date: string,
        start_time: string,
        session: number,
        procedure_id: number,
        excludeId?: number,
    ) {
        const [professional, procedure] = await Promise.all([
            this.usersService.findProfessionalById(professional_id),
            Procedure.findByPk(procedure_id),
        ]);

        if (!professional)
            throw new NotFoundException(
                `Profissional com ID ${professional_id} não encontrado`,
            );
        if (!procedure)
            throw new NotFoundException(
                `Procedimento com ID ${procedure_id} não encontrado`,
            );

        const duration =
            session === 0
                ? procedure.triagem_minutes
                : procedure.duration_minutes;
        const startMin = this.timeToMinutes(start_time);
        const endMin = startMin + duration;
        const day_of_week = new Date(date + 'T00:00:00Z').getUTCDay();

        const [coveringWorkSchedules, exceptions] = await Promise.all([
            this.workScheduleRepository.findCovering(
                professional_id,
                day_of_week,
                startMin,
                endMin,
            ),
            this.scheduleExceptionsRepository.findExceptionsForDate(
                professional_id,
                date,
            ),
        ]);

        const coveringOpen = exceptions
            .filter(
                (e) =>
                    e.type === ScheduleExceptionType.OPEN &&
                    e.start_time &&
                    e.end_time,
            )
            .some((e) => {
                const eStart = this.timeToMinutes(e.start_time!);
                const eEnd = this.timeToMinutes(e.end_time!);
                return eStart <= startMin && eEnd >= endMin;
            });

        if (coveringWorkSchedules.length === 0 && !coveringOpen) {
            throw new ConflictException(
                'Profissional não possui disponibilidade no horário solicitado',
            );
        }

        const isBlocked = exceptions
            .filter((e) => e.type === ScheduleExceptionType.BLOCKED)
            .some((e) => {
                if (!e.start_time || !e.end_time) return true;
                const bStart = this.timeToMinutes(e.start_time);
                const bEnd = this.timeToMinutes(e.end_time);
                return startMin < bEnd && endMin > bStart;
            });

        if (isBlocked)
            throw new ConflictException('O horário solicitado está bloqueado');

        const overlapping = await this.scheduleRepository.findOverlapping(
            professional_id,
            date,
            startMin,
            endMin,
            excludeId,
        );
        if (overlapping.length > 0)
            throw new ConflictException(
                'Já existe um agendamento nesse horário',
            );
    }

    private timeToMinutes(time: string): number {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }
}
