import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ProcedureProfessional, Schedule } from '../../../common/models';
import {
    ScheduleException,
    ScheduleExceptionType,
} from '../../../common/models/schedule-exceptions.model';
import { WorkSchedule } from '../../../common/models/work-schedules.model';
import { UserWithType } from '../../../common/types/users.type';
import { Utils } from '../../../common/utils/utils';
import { UsersService } from '../../users/users.service';
import { WorkScheduleRepository } from '../repositories/work-schedules.repository';
import { assertProfessionalAccess } from '../utils/professional-access';
import { WorkScheduleAvailabilityDto } from '../validation/work-schedule-availability.DTO';
import { WorkScheduleCreateDto } from '../validation/work-schedule-create.DTO';
import { WorkScheduleGetAllDto } from '../validation/work-schedule-get-all.DTO';
import { WorkScheduleUpdateDto } from '../validation/work-schedule-update.DTO';
import { ScheduleExceptionsService } from './schedule-exceptions.service';
import { SchedulesService } from './schedules.service';

@Injectable()
export class WorkSchedulesService {
    constructor(
        private readonly usersService: UsersService,
        private readonly schedulesService: SchedulesService,
        private readonly workSchedulesRepository: WorkScheduleRepository,
        private readonly scheduleExceptionsService: ScheduleExceptionsService,
    ) {}

    logger = new Logger(WorkSchedulesService.name);

    private async allowedProfessionalIds(
        procedure_id?: number,
    ): Promise<Set<number> | null> {
        if (!procedure_id) return null;
        const links = await ProcedureProfessional.findAll({
            where: { procedure_id },
            attributes: ['professional_id'],
        });
        return new Set(links.map((link) => link.professional_id));
    }

    async create(dto: WorkScheduleCreateDto, user: UserWithType) {
        const dbTransaction = await WorkSchedule.sequelize!.transaction();

        try {
            assertProfessionalAccess(user, dto.professional_id);
            const professional = await this.usersService.findProfessionalById(
                dto.professional_id,
            );
            if (!professional) {
                throw new NotFoundException(
                    `Profissional com ID ${dto.professional_id} não encontrado`,
                );
            }

            for (const day_of_week of dto.days_of_week) {
                await this.workSchedulesRepository.create(
                    dto,
                    day_of_week,
                    dbTransaction,
                );
            }

            await dbTransaction.commit();
            return { message: 'Horário de trabalho criado com sucesso' };
        } catch (error) {
            Utils.logError(
                this.logger,
                'Failed to create work schedule',
                error,
            );
            await dbTransaction.rollback();
            Utils.handleError(error);
        }
    }

    async findAll(dto: WorkScheduleGetAllDto, user: UserWithType) {
        try {
            const scopedDto = this.scopeToProfessional(dto, user);
            return await this.workSchedulesRepository.findAllByFilters(
                scopedDto,
            );
        } catch (error) {
            Utils.logError(this.logger, 'Failed to list work schedules', error);
            Utils.handleError(error);
        }
    }

    private scopeToProfessional(
        dto: WorkScheduleGetAllDto,
        user: UserWithType,
    ): WorkScheduleGetAllDto {
        if (user.professional?.is_admin) return dto;
        if (!user.professional) {
            throw new ForbiddenException(
                'Você só pode gerenciar a própria disponibilidade',
            );
        }
        if (
            dto.professional_id !== undefined &&
            dto.professional_id !== user.professional.id
        ) {
            throw new ForbiddenException(
                'Você só pode gerenciar a própria disponibilidade',
            );
        }
        return { ...dto, professional_id: user.professional.id };
    }

    async getAll(dto: WorkScheduleGetAllDto) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const baseDate = dto.date ?? today;
            const todayDate = new Date(baseDate + 'T00:00:00Z');
            const todayDay = todayDate.getUTCDay();
            const allowedProfessionalIds = await this.allowedProfessionalIds(
                dto.procedure_id,
            );

            if (dto.day_of_week !== undefined) {
                const targetDateStr =
                    dto.date ??
                    this.getTargetDateStr(dto.day_of_week, today, todayDay);
                const effectiveDto = { ...dto, day_of_week: dto.day_of_week };

                if (dto.professional_id) {
                    if (
                        allowedProfessionalIds &&
                        !allowedProfessionalIds.has(dto.professional_id)
                    ) {
                        return {};
                    }
                    const [professional, slots] = await Promise.all([
                        this.usersService.findProfessionalById(
                            dto.professional_id,
                        ),
                        this.computeSlotsForProfessional(
                            dto.professional_id,
                            targetDateStr,
                            effectiveDto,
                        ),
                    ]);
                    const name =
                        professional?.user?.name ??
                        `Profissional ${dto.professional_id}`;
                    return { [name]: slots };
                }

                const professionals =
                    await this.usersService.findAllProfessionals();
                const filteredProfessionals = allowedProfessionalIds
                    ? (professionals ?? []).filter((professional) =>
                          allowedProfessionalIds.has(professional.id),
                      )
                    : (professionals ?? []);
                const results = await Promise.all(
                    filteredProfessionals.map(async (p) => ({
                        name: p.user.name,
                        slots: await this.computeSlotsForProfessional(
                            p.id,
                            targetDateStr,
                            effectiveDto,
                        ),
                    })),
                );
                return Object.fromEntries(
                    results.map((r) => [r.name, r.slots]),
                );
            }

            const allDays = [0, 1, 2, 3, 4, 5, 6];

            if (dto.professional_id) {
                if (
                    allowedProfessionalIds &&
                    !allowedProfessionalIds.has(dto.professional_id)
                ) {
                    return {};
                }
                const [professional, dayResults] = await Promise.all([
                    this.usersService.findProfessionalById(dto.professional_id),
                    Promise.all(
                        allDays.map(async (day) => {
                            const dateStr =
                                dto.date ??
                                this.getTargetDateStr(day, today, todayDay);
                            const slots =
                                await this.computeSlotsForProfessional(
                                    dto.professional_id,
                                    dateStr,
                                    { ...dto, day_of_week: day },
                                );
                            return { date: dateStr, slots };
                        }),
                    ),
                ]);
                const name =
                    professional?.user?.name ??
                    `Profissional ${dto.professional_id}`;
                const sorted = dayResults
                    .filter((r) => r.slots.length > 0)
                    .sort((a, b) => a.date.localeCompare(b.date));
                return {
                    [name]: Object.fromEntries(
                        sorted.map((r) => [r.date, r.slots]),
                    ),
                };
            }

            const professionals =
                await this.usersService.findAllProfessionals();
            const filteredProfessionals = allowedProfessionalIds
                ? (professionals ?? []).filter((professional) =>
                      allowedProfessionalIds.has(professional.id),
                  )
                : (professionals ?? []);
            const results = await Promise.all(
                filteredProfessionals.map(async (p) => {
                    const dayResults = await Promise.all(
                        allDays.map(async (day) => {
                            const dateStr =
                                dto.date ??
                                this.getTargetDateStr(day, today, todayDay);
                            const slots =
                                await this.computeSlotsForProfessional(
                                    p.id,
                                    dateStr,
                                    { ...dto, day_of_week: day },
                                );
                            return { date: dateStr, slots };
                        }),
                    );
                    return {
                        name: p.user.name,
                        dates: Object.fromEntries(
                            dayResults
                                .filter((r) => r.slots.length > 0)
                                .sort((a, b) => a.date.localeCompare(b.date))
                                .map((r) => [r.date, r.slots]),
                        ),
                    };
                }),
            );
            return Object.fromEntries(results.map((r) => [r.name, r.dates]));
        } catch (error) {
            Utils.logError(
                this.logger,
                'Failed to get all work schedules',
                error,
            );
            Utils.handleError(error);
        }
    }

    async getAvailableDates(dto: WorkScheduleAvailabilityDto) {
        try {
            const dates = await this.availableDatesForRange(
                dto.from,
                dto.to,
                dto.procedure_id,
            );
            return { dates };
        } catch (error) {
            Utils.logError(this.logger, 'Failed to get available dates', error);
            Utils.handleError(error);
        }
    }

    async getAvailabilitySummary(dto: WorkScheduleAvailabilityDto) {
        try {
            const links = await ProcedureProfessional.findAll({
                attributes: ['procedure_id', 'professional_id'],
            });
            const groups = new Map<number, number[]>();
            for (const link of links) {
                const ids = groups.get(link.procedure_id) ?? [];
                ids.push(link.professional_id);
                groups.set(link.procedure_id, ids);
            }

            const summary = await Promise.all(
                [...groups.entries()].map(async ([procedureId, ids]) => {
                    const dates = await this.availableDatesForRange(
                        dto.from,
                        dto.to,
                        procedureId,
                        ids,
                    );
                    return {
                        procedure_id: procedureId,
                        next_date: dates[0] ?? null,
                    };
                }),
            );

            return summary.sort((a, b) => a.procedure_id - b.procedure_id);
        } catch (error) {
            Utils.logError(
                this.logger,
                'Failed to get availability summary',
                error,
            );
            Utils.handleError(error);
        }
    }

    private async availableDatesForRange(
        from: string,
        to: string,
        procedureId?: number,
        professionalIds?: number[],
    ) {
        const start = new Date(`${from}T00:00:00Z`);
        const end = new Date(`${to}T00:00:00Z`);
        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end < start
        ) {
            throw new BadRequestException('Intervalo de datas inválido');
        }
        const totalDays =
            Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
        if (totalDays > 90) {
            throw new BadRequestException(
                'O intervalo máximo de disponibilidade é de 90 dias',
            );
        }

        const allowedProfessionalIds =
            await this.allowedProfessionalIds(procedureId);
        const ids = professionalIds
            ? professionalIds
            : allowedProfessionalIds
              ? [...allowedProfessionalIds]
              : ((await this.usersService.findAllProfessionals())?.map(
                    (professional) => professional.id,
                ) ?? []);

        const dates: string[] = [];
        for (let offset = 0; offset < totalDays; offset += 1) {
            const date = new Date(start.getTime() + offset * 86400000);
            const dateStr = date.toISOString().slice(0, 10);
            const dayOfWeek = date.getUTCDay();
            const results = await Promise.all(
                ids.map((professionalId) =>
                    this.computeSlotsForProfessional(professionalId, dateStr, {
                        day_of_week: dayOfWeek,
                        date: dateStr,
                        procedure_id: procedureId,
                    } as WorkScheduleGetAllDto),
                ),
            );
            if (results.some((slots) => slots.length > 0)) {
                dates.push(dateStr);
            }
        }
        return dates;
    }

    private async computeSlotsForProfessional(
        professional_id: number,
        today: string,
        dto: WorkScheduleGetAllDto,
    ) {
        const [workSchedules, bookedSchedules, exceptions] = await Promise.all([
            this.workSchedulesRepository.findAllByFilters({
                ...dto,
                professional_id,
            }),
            this.schedulesService.findSchedulesForDate(professional_id, today),
            this.scheduleExceptionsService.findExceptionsForDate(
                professional_id,
                today,
            ),
        ]);

        const openExceptions = exceptions.filter(
            (e) => e.type === ScheduleExceptionType.OPEN,
        );
        const blockedExceptions = exceptions.filter(
            (e) => e.type === ScheduleExceptionType.BLOCKED,
        );

        const workSlots = workSchedules.flatMap((ws) => this.expandToSlots(ws));
        const openSlots = openExceptions.flatMap((e) =>
            this.expandExceptionToSlots(e),
        );

        const seen = new Set<string>();
        const merged = [...workSlots, ...openSlots].filter((slot) => {
            if (seen.has(slot.start_time)) return false;
            seen.add(slot.start_time);
            return true;
        });

        return merged
            .filter(
                (slot) =>
                    (!dto.start_time || slot.start_time >= dto.start_time) &&
                    (!dto.end_time || slot.end_time <= dto.end_time),
            )
            .map((slot) => ({
                ...slot,
                date: today,
                available:
                    !this.isSlotOccupied(slot, bookedSchedules) &&
                    !this.isSlotBlocked(slot, blockedExceptions),
            }))
            .filter((slot) => slot.available);
    }

    async update(id: number, dto: WorkScheduleUpdateDto, user: UserWithType) {
        try {
            const existing = await this.workSchedulesRepository.findById(id);
            if (!existing) {
                throw new NotFoundException(
                    `Work schedule with ID ${id} not found`,
                );
            }
            assertProfessionalAccess(user, existing.professional_id);
            if (dto.professional_id !== undefined) {
                assertProfessionalAccess(user, dto.professional_id);
            }
            return await this.workSchedulesRepository.update(id, dto);
        } catch (error) {
            Utils.logError(
                this.logger,
                'Failed to update work schedule',
                error,
            );
            Utils.handleError(error);
        }
    }

    async delete(id: number, user: UserWithType) {
        try {
            const existing = await this.workSchedulesRepository.findById(id);
            if (!existing) {
                throw new NotFoundException(
                    `Work schedule with ID ${id} not found`,
                );
            }
            assertProfessionalAccess(user, existing.professional_id);
            return await this.workSchedulesRepository.delete(id);
        } catch (error) {
            Utils.logError(
                this.logger,
                'Failed to delete work schedule',
                error,
            );
            Utils.handleError(error);
        }
    }

    private expandToSlots(schedule: WorkSchedule, slotMinutes = 15) {
        const start = this.timeToMinutes(schedule.start_time);
        const end = this.timeToMinutes(schedule.end_time);
        const slots: {
            professional_id: number;
            day_of_week: number;
            start_time: string;
            end_time: string;
        }[] = [];

        for (let t = start; t + slotMinutes <= end; t += slotMinutes) {
            slots.push({
                professional_id: schedule.professional_id,
                day_of_week: schedule.day_of_week,
                start_time: this.minutesToTime(t),
                end_time: this.minutesToTime(t + slotMinutes),
            });
        }

        return slots;
    }

    private isSlotOccupied(
        slot: { start_time: string; end_time: string },
        schedules: Schedule[],
    ): boolean {
        const slotStart = this.timeToMinutes(slot.start_time);
        const slotEnd = this.timeToMinutes(slot.end_time);

        return schedules.some((schedule) => {
            const duration =
                schedule.session === 0
                    ? schedule.procedure.triagem_minutes
                    : schedule.procedure.duration_minutes;

            const schedStart = this.timeToMinutes(schedule.start_time);
            const schedEnd = schedStart + duration;

            return slotStart < schedEnd && slotEnd > schedStart;
        });
    }

    private expandExceptionToSlots(
        exception: ScheduleException,
        slotMinutes = 15,
    ) {
        if (!exception.start_time || !exception.end_time) return [];

        const start = this.timeToMinutes(exception.start_time);
        const end = this.timeToMinutes(exception.end_time);
        const slots: {
            professional_id: number;
            day_of_week: number;
            start_time: string;
            end_time: string;
        }[] = [];

        for (let t = start; t + slotMinutes <= end; t += slotMinutes) {
            slots.push({
                professional_id: exception.professional_id,
                day_of_week: new Date(
                    exception.date + 'T00:00:00Z',
                ).getUTCDay(),
                start_time: this.minutesToTime(t),
                end_time: this.minutesToTime(t + slotMinutes),
            });
        }

        return slots;
    }

    private isSlotBlocked(
        slot: { start_time: string; end_time: string },
        blockedExceptions: ScheduleException[],
    ): boolean {
        const slotStart = this.timeToMinutes(slot.start_time);
        const slotEnd = this.timeToMinutes(slot.end_time);

        return blockedExceptions.some((exception) => {
            if (!exception.start_time || !exception.end_time) return true;

            const blockStart = this.timeToMinutes(exception.start_time);
            const blockEnd = this.timeToMinutes(exception.end_time);

            return slotStart < blockEnd && slotEnd > blockStart;
        });
    }

    private timeToMinutes(time: string) {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }

    private minutesToTime(minutes: number) {
        return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    }

    getTargetDateStr(day: number, todayDate: string, todayDay: number) {
        const diff = (day - todayDay + 7) % 7;
        const d = new Date(todayDate);
        d.setUTCDate(d.getUTCDate() + diff);
        return d.toISOString().split('T')[0];
    }
}
