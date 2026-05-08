import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { Client, User } from 'src/common/models';

@Injectable()
export class ClientsRepository {
    async create(user: User, transaction: Transaction) {
        const client = await Client.create(
            {
                user_id: user.id,
            },
            { transaction },
        );
        return {
            message: 'Client created in the database successfully',
            user,
            client,
        };
    }
}
