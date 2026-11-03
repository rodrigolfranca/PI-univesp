import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { Pop } from 'src/common/models';

@Injectable()
export class PopsRepository {
    async create(payload: {
        procedure_id: number;
        content: Buffer;
        name: string;
    }) {
        return Pop.create({
            procedure_id: payload.procedure_id,
            content: payload.content,
            name: payload.name,
        });
    }

    async list(options: {
        page?: number;
        limit?: number;
        procedure_id?: number;
        name?: string;
    }) {
        const page = options.page ?? 1;
        const limit = options.limit ?? 10;
        const offset = (page - 1) * limit;
        const where = {
            ...(options.procedure_id !== undefined
                ? { procedure_id: options.procedure_id }
                : {}),
            ...(options.name
                ? { name: { [Op.iLike]: `%${options.name}%` } }
                : {}),
        };

        return Pop.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
        });
    }

    async getById(id: number) {
        return Pop.findByPk(id);
    }

    async update(
        instance: Pop,
        changes: Partial<{
            name: string;
            content?: Buffer;
            procedure_id?: number;
        }>,
    ) {
        await instance.update(changes);
        return instance;
    }

    async remove(instance: Pop) {
        await instance.destroy();
        return instance;
    }
}
