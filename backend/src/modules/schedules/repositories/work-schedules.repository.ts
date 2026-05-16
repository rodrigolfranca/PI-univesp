import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Op, Transaction, WhereOptions } from 'sequelize';
import { WorkSchedule } from 'src/common/models';
import { WorkScheduleCreateDto } from '../validation/work-schedule-create.DTO';
import { WorkScheduleGetAllDto } from '../validation/work-schedule-get-all.DTO';
import { WorkScheduleUpdateDto } from '../validation/work-schedule-update.DTO';

export class WorkScheduleRepository {
    async create(
        workScheduleCreateDto: WorkScheduleCreateDto,
        day_of_week: number,
        transaction: Transaction,
    ) {
        return await WorkSchedule.create(
            {
                professional_id: workScheduleCreateDto.professional_id,
                day_of_week: day_of_week,
                start_time: workScheduleCreateDto.start_time,
                end_time: workScheduleCreateDto.end_time,
            },
            { transaction },
        );
    }

    async findAllByFilters(dto: WorkScheduleGetAllDto) {
        const where: WhereOptions = {};
        if (dto.day_of_week !== undefined)
            where['day_of_week'] = dto.day_of_week;
        if (dto.professional_id !== undefined)
            where['professional_id'] = dto.professional_id;
        if (dto.start_time !== undefined)
            where['end_time'] = { [Op.gt]: dto.start_time };
        if (dto.end_time !== undefined)
            where['start_time'] = { [Op.lt]: dto.end_time };

        return await WorkSchedule.findAll({
            where,
            order: [
                ['day_of_week', 'ASC'],
                ['start_time', 'ASC'],
            ],
        });
    }

    async update(id: number, dto: WorkScheduleUpdateDto) {
        const [updatedCount] = await WorkSchedule.update(
            {
                ...(dto.day_of_week !== undefined && {
                    day_of_week: dto.day_of_week,
                }),
                ...(dto.start_time !== undefined && {
                    start_time: dto.start_time,
                }),
                ...(dto.end_time !== undefined && { end_time: dto.end_time }),
                ...(dto.professional_id !== undefined && {
                    professional_id: dto.professional_id,
                }),
            },
            { where: { id } },
        );
        if (updatedCount === 0) {
            throw new NotFoundException(
                `Work schedule with ID ${id} not found`,
            );
        }
        return { message: 'Work schedule updated successfully' };
    }

    async delete(id: number) {
        const deletedCount = await WorkSchedule.destroy({ where: { id } });
        if (deletedCount === 0) {
            throw new NotFoundException(
                `Work schedule with ID ${id} not found`,
            );
        }
        return { message: 'Work schedule deleted successfully' };
    }

    /** Returns all work schedules for a professional on a given day_of_week. */
    async findForProfessionalDay(
        professional_id: number,
        day_of_week: number,
    ): Promise<WorkSchedule[]> {
        return WorkSchedule.findAll({
            where: { professional_id, day_of_week },
        });
    }

    /**
     * Returns work schedules whose entire range covers [startMin, endMin].
     * Used to confirm a professional has availability for a specific slot.
     */
    async findCovering(
        professional_id: number,
        day_of_week: number,
        startMin: number,
        endMin: number,
    ): Promise<WorkSchedule[]> {
        const schedules = await this.findForProfessionalDay(
            professional_id,
            day_of_week,
        );
        return schedules.filter((ws) => {
            const wsStart = this.timeToMinutes(ws.start_time);
            const wsEnd = this.timeToMinutes(ws.end_time);
            return wsStart <= startMin && wsEnd >= endMin;
        });
    }

    private timeToMinutes(time: string): number {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }
}
