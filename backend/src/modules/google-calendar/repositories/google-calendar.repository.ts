import { Injectable, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import {
    Client,
    Procedure,
    Professional,
    Schedule,
    User,
} from 'src/common/models';

@Injectable()
export class GoogleCalendarRepository {
    async findConnectedAdmin(): Promise<Professional | null> {
        return await Professional.scope('withGoogleToken').findOne({
            where: {
                is_admin: true,
                google_refresh_token: { [Op.ne]: null },
            },
        });
    }

    async saveConnection(
        professional_id: number,
        encrypted_refresh_token: string,
    ): Promise<void> {
        const transaction = await Professional.sequelize!.transaction();
        try {
            await Professional.update(
                { google_refresh_token: null },
                {
                    where: {
                        id: { [Op.ne]: professional_id },
                        google_refresh_token: { [Op.ne]: null },
                    },
                    transaction,
                },
            );

            const [count] = await Professional.update(
                { google_refresh_token: encrypted_refresh_token },
                { where: { id: professional_id }, transaction },
            );
            if (count === 0) {
                throw new NotFoundException(
                    `Profissional com ID ${professional_id} não encontrado`,
                );
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async clearConnection(professional_id: number): Promise<void> {
        await Professional.update(
            { google_refresh_token: null },
            { where: { id: professional_id } },
        );
    }

    async findScheduleForSync(schedule_id: number): Promise<Schedule | null> {
        return await Schedule.findByPk(schedule_id, {
            include: [{ model: Procedure, as: 'procedure' }],
        });
    }

    async findClientWithUser(client_id: number): Promise<Client | null> {
        return await Client.findByPk(client_id, {
            include: [{ model: User, as: 'user' }],
        });
    }

    async findProfessionalWithUser(
        professional_id: number,
    ): Promise<Professional | null> {
        return await Professional.findByPk(professional_id, {
            include: [{ model: User, as: 'user' }],
        });
    }

    async saveEventMetadata(
        schedule_id: number,
        google_event_id: string | null,
        google_event_link: string | null,
    ): Promise<void> {
        await Schedule.update(
            { google_event_id, google_event_link },
            { where: { id: schedule_id } },
        );
    }

    async findAllScheduleIds(): Promise<number[]> {
        const schedules = await Schedule.findAll({
            attributes: ['id'],
            order: [['id', 'ASC']],
        });
        return schedules.map((schedule) => schedule.id);
    }
}
