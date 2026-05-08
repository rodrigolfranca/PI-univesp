import { Injectable, NotFoundException } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { Client, Professional, User } from 'src/common/models';
import { UsersCreateDTO } from '../validation/users-create.DTO';
import { UsersListDTO } from '../validation/users-list.DTO';
import { UserUpdateDTO } from '../validation/users-update.DTO';

@Injectable()
export class UsersRepository {
    async startTransaction() {
        return await User.sequelize!.transaction();
    }
    async create(userCreateDTO: UsersCreateDTO, transaction?: Transaction) {
        return await User.create(
            {
                name: userCreateDTO.name,
                phone_number: userCreateDTO.phone_number,
                phone_number_confirmed: userCreateDTO.phone_number_confirmed,
                email: userCreateDTO.email,
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

    async delete(id: number) {
        const user = await User.findByPk(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await user.destroy();
        return { message: 'User deleted successfully' };
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
