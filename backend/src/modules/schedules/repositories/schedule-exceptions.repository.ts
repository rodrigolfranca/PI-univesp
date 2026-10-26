import { NotFoundException } from '@nestjs/common';
import { WhereOptions } from 'sequelize';
import { ScheduleException } from 'src/common/models/schedule-exceptions.model';
import { ScheduleExceptionCreateDto } from '../validation/schedule-exception-create.DTO';
import { ScheduleExceptionGetAllDto } from '../validation/schedule-exception-get-all.DTO';
import { ScheduleExceptionUpdateDto } from '../validation/schedule-exception-update.DTO';

export class ScheduleExceptionsRepository {
    async create(dto: ScheduleExceptionCreateDto): Promise<ScheduleException> {
        return ScheduleException.create({ ...dto });
    }

    async findById(id: number): Promise<ScheduleException | null> {
        return ScheduleException.findByPk(id);
    }

    async findExceptionsForDate(
        professional_id: number,
        date: string,
    ): Promise<ScheduleException[]> {
        return ScheduleException.findAll({ where: { professional_id, date } });
    }

    async findByFilters(dto: ScheduleExceptionGetAllDto) {
        const where: WhereOptions = {};
        if (dto.professional_id) where['professional_id'] = dto.professional_id;
        if (dto.date) where['date'] = dto.date;
        if (dto.type) where['type'] = dto.type;

        const { count, rows } = await ScheduleException.findAndCountAll({
            where,
            limit: dto.limit,
            offset: (dto.page - 1) * dto.limit,
            order: [
                ['date', 'ASC'],
                ['start_time', 'ASC'],
            ],
        });

        return { total: count, page: dto.page, limit: dto.limit, data: rows };
    }

    async update(
        id: number,
        dto: ScheduleExceptionUpdateDto,
    ): Promise<{ message: string }> {
        const [count] = await ScheduleException.update(
            {
                ...(dto.professional_id !== undefined && {
                    professional_id: dto.professional_id,
                }),
                ...(dto.date !== undefined && { date: dto.date }),
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.start_time !== undefined && {
                    start_time: dto.start_time,
                }),
                ...(dto.end_time !== undefined && { end_time: dto.end_time }),
            },
            { where: { id } },
        );
        if (count === 0)
            throw new NotFoundException(
                `Exceção de agenda com ID ${id} não encontrada`,
            );
        return { message: 'Exceção de agenda atualizada com sucesso' };
    }

    async delete(id: number): Promise<{ message: string }> {
        const count = await ScheduleException.destroy({ where: { id } });
        if (count === 0)
            throw new NotFoundException(
                `Exceção de agenda com ID ${id} não encontrada`,
            );
        return { message: 'Exceção de agenda excluída com sucesso' };
    }
}
