import { Injectable } from '@nestjs/common';
import { Transaction, Op } from 'sequelize';
import { Pop } from 'src/common/models';

@Injectable()
export class PopsRepository {
    async startTransaction(): Promise<Transaction> {
        return Pop.sequelize!.transaction();
    }

    async create(
        payload: {
            procedure_id: number;
            base64: Buffer;
            name: string;
            mime_type?: string | null;
        },
        transaction?: Transaction,
    ) {
        const created = await Pop.create(
            {
                procedure_id: payload.procedure_id,
                base64: payload.base64,
                name: payload.name,
                mime_type: payload.mime_type ?? null,
            },
            transaction ? { transaction } : undefined,
        );
        return created;
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
        const where: any = {};

        if (options.procedure_id !== undefined) {
            where.procedure_id = options.procedure_id;
        }

        if (options.name) {
            where.name = { [Op.iLike]: `%${options.name}%` };
        }

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
            mime_type?: string | null;
            base64?: Buffer;
            procedure_id?: number;
        }>,
        transaction?: Transaction,
    ) {
        await instance.update(
            changes,
            transaction ? { transaction } : undefined,
        );
        return instance;
    }

    async remove(instance: Pop, transaction?: Transaction) {
        await instance.destroy(transaction ? { transaction } : undefined);
        return instance;
    }
}
