import { NotFoundException } from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import { ScheduleStatus } from 'src/common/consts/schedule.status';
import { Procedure, Schedule } from 'src/common/models';
import { ScheduleCreateDto } from '../validation/schedule-create.DTO';
import { ScheduleGetAllDto } from '../validation/schedule-get-all.DTO';
import { ScheduleUpdateDto } from '../validation/schedule-update.DTO';

export class ScheduleRepository {
    async create(dto: ScheduleCreateDto): Promise<Schedule> {
        return Schedule.create({ ...dto, status: ScheduleStatus.SCHEDULED });
    }

    async findById(id: number): Promise<Schedule | null> {
        return Schedule.findByPk(id, {
            include: [{ model: Procedure, as: 'procedure' }],
        });
    }

    async findSchedulesForDate(
        professional_id: number,
        date: string,
    ): Promise<Schedule[]> {
        return Schedule.findAll({
            where: { professional_id, date },
            include: [{ model: Procedure, as: 'procedure' }],
        });
    }

    async findByFilters(dto: ScheduleGetAllDto) {
        const where: WhereOptions = {};
        if (dto.professional_id) where['professional_id'] = dto.professional_id;
        if (dto.client_id) where['client_id'] = dto.client_id;
        if (dto.date) where['date'] = dto.date;
        if (dto.status) where['status'] = dto.status;

        const { count, rows } = await Schedule.findAndCountAll({
            where,
            include: [{ model: Procedure, as: 'procedure' }],
            limit: dto.limit,
            offset: (dto.page - 1) * dto.limit,
            order: [
                ['date', 'ASC'],
                ['start_time', 'ASC'],
            ],
        });

        return { total: count, page: dto.page, limit: dto.limit, data: rows };
    }

    async findOverlapping(
        professional_id: number,
        date: string,
        startMin: number,
        endMin: number,
        excludeId?: number,
    ): Promise<Schedule[]> {
        const where: WhereOptions = {
            professional_id,
            date,
            ...(excludeId !== undefined ? { id: { [Op.ne]: excludeId } } : {}),
        };

        const schedules = await Schedule.findAll({
            where,
            include: [{ model: Procedure, as: 'procedure' }],
        });

        return schedules.filter((s) => {
            const duration =
                s.session === 0
                    ? s.procedure.triagem_minutes
                    : s.procedure.duration_minutes;
            const sStart = this.timeToMinutes(s.start_time);
            const sEnd = sStart + duration;
            return startMin < sEnd && endMin > sStart;
        });
    }

    async update(
        id: number,
        dto: ScheduleUpdateDto,
    ): Promise<{ message: string }> {
        const [count] = await Schedule.update(
            {
                ...(dto.procedure_id !== undefined && {
                    procedure_id: dto.procedure_id,
                }),
                ...(dto.professional_id !== undefined && {
                    professional_id: dto.professional_id,
                }),
                ...(dto.client_id !== undefined && {
                    client_id: dto.client_id,
                }),
                ...(dto.document_id !== undefined && {
                    document_id: dto.document_id,
                }),
                ...(dto.date !== undefined && { date: dto.date }),
                ...(dto.start_time !== undefined && {
                    start_time: dto.start_time,
                }),
                ...(dto.session !== undefined && { session: dto.session }),
                ...(dto.status !== undefined && { status: dto.status }),
            },
            { where: { id } },
        );
        if (count === 0)
            throw new NotFoundException(
                `Agendamento com ID ${id} não encontrado`,
            );
        return { message: 'Agendamento atualizado com sucesso' };
    }

    async delete(id: number): Promise<{ message: string }> {
        const count = await Schedule.destroy({ where: { id } });
        if (count === 0)
            throw new NotFoundException(
                `Agendamento com ID ${id} não encontrado`,
            );
        return { message: 'Agendamento excluído com sucesso' };
    }

    private timeToMinutes(time: string): number {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }
}
