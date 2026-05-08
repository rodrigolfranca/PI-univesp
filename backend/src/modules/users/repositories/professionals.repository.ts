import { Injectable } from '@nestjs/common';
import { Professional } from 'src/common/models';

@Injectable()
export class ProfessionalsRepository {
    async create(user: any, isAdmin: boolean) {
        const professional = await Professional.create({
            user_id: user.id,
            isAdmin: isAdmin,
        })
        return { message: 'Professional created in the database successfully', user, professional };
    }
}
