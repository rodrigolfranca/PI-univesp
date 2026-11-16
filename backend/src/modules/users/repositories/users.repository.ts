import { Injectable, NotFoundException } from '@nestjs/common';
import { Op, Transaction } from 'sequelize';
import { ScheduleStatus } from '../../../common/consts/schedule.status';
import { Client, Professional, Schedule, User } from '../../../common/models';
import { UsersCreateDTO } from '../validation/users-create.DTO';
import { UsersListDTO } from '../validation/users-list.DTO';
import { UserUpdateDTO } from '../validation/users-update.DTO';

@Injectable()
export class UsersRepository {
    async startTransaction() {
        return await User.sequelize!.transaction();
    }
    async create(
        userCreateDTO: UsersCreateDTO & { email_confirmed?: boolean },
        transaction?: Transaction,
    ) {
        return await User.create(
            {
                name: userCreateDTO.name,
                phone_number: userCreateDTO.phone_number,
                phone_number_confirmed: userCreateDTO.phone_number_confirmed,
                email: userCreateDTO.email,
                email_confirmed: userCreateDTO.email_confirmed ?? false,
            },
            { transaction },
        );
    }

    async list(usersListDTO: UsersListDTO) {
        const { page, limit } = usersListDTO;
        const offset = (page - 1) * limit;
        return await User.findAndCountAll({
            limit,
            offset,
            include: [
                {
                    model: Client,
                    as: 'client',
                    required: false,
                },
                {
                    model: Professional,
                    as: 'professional',
                    required: false,
                },
            ],
        });
    }

    async getById(id: number) {
        return await User.findByPk(id, {
            include: [
                {
                    model: Client,
                    as: 'client',
                    required: false,
                },
                {
                    model: Professional,
                    as: 'professional',
                    required: false,
                },
            ],
        });
    }

    async update(id: number, userUpdateDTO: UserUpdateDTO) {
        const user = await User.findByPk(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return await user.update(userUpdateDTO);
    }

    async updateContact(
        id: number,
        data: {
            email?: string;
            email_confirmed?: boolean;
            phone_number?: string;
            phone_number_confirmed?: boolean;
        },
    ) {
        const user = await User.findByPk(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return await user.update(data);
    }

    async countUpcomingSchedules(id: number, fromDate: string) {
        const user = await this.getById(id);
        if (!user) return 0;

        const ownerFilters = [
            ...(user.client ? [{ client_id: user.client.id }] : []),
            ...(user.professional
                ? [{ professional_id: user.professional.id }]
                : []),
        ];
        if (ownerFilters.length === 0) return 0;

        return await Schedule.count({
            where: {
                status: ScheduleStatus.SCHEDULED,
                date: { [Op.gte]: fromDate },
                [Op.or]: ownerFilters,
            },
        });
    }

    async delete(id: number) {
        const user = await User.findByPk(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const transaction = await User.sequelize!.transaction();
        try {
            await Client.destroy({ where: { user_id: id }, transaction });
            await Professional.destroy({ where: { user_id: id }, transaction });
            await user.destroy({ transaction });
            await transaction.commit();
            return { message: 'User deleted successfully' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async findByPhoneNumber(phone_number: string) {
        return await User.findOne({ where: { phone_number } });
    }

    async findByEmail(email: string) {
        return await User.findOne({ where: { email } });
    }

    async isUserPhoneNumber(id: number, phone_number: string) {
        return !!(await User.findOne({ where: { id, phone_number } }));
    }

    async isUserEmail(id: number, email: string) {
        return !!(await User.findOne({ where: { id, email } }));
    }
}
