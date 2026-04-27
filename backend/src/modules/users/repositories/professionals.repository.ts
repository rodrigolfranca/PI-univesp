import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { Professional, User } from 'src/common/models';

@Injectable()
export class ProfessionalsRepository {
    async create(user: User, is_admin: boolean, transaction: Transaction) {
        const professional = await Professional.create(
            {
                user_id: user.id,
                is_admin: is_admin,
            },
            { transaction },
        );
        return {
            message: 'Professional created in the database successfully',
            user,
            professional,
        };
    }
}
