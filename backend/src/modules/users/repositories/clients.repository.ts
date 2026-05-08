import { Injectable } from '@nestjs/common';
import { Client } from 'src/common/models';

@Injectable()
export class ClientsRepository {
    async create(user: any) {
        const client = await Client.create({
            user_id: user.id,
        })
        return { message: 'Client created in the database successfully', user, client };
    }
}
