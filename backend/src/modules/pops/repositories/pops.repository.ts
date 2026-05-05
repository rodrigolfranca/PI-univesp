import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { Pop } from 'src/common/models';

@Injectable()
export class PopsRepository {
  async startTransaction(): Promise<Transaction> {
    return Pop.sequelize!.transaction();
  }

  async create(
    payload: { procedure_id: number; base64: string; name: string; mime_type?: string | null },
    transaction?: Transaction,
  ) {
    const created = await Pop.create(
      {
        procedure_id: payload.procedure_id,
        base64: Buffer.from(payload.base64, 'base64'),
        name: payload.name,
        mime_type: payload.mime_type ?? null,
      },
      transaction ? { transaction } : undefined,
    );
    return created;
  }

  async list(options: { page?: number; limit?: number; procedure_id?: number }) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const offset = (page - 1) * limit;
    const where: any = {};
    if (options.procedure_id) where.procedure_id = options.procedure_id;

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
    changes: Partial<{ name: string; mime_type?: string | null; base64?: string; procedure_id?: number }>,
  ) {
    if (changes.name !== undefined) instance.name = changes.name;
    if (changes.mime_type !== undefined) instance.mime_type = changes.mime_type ?? null;
    if (changes.base64 !== undefined) instance.base64 = Buffer.from(changes.base64, 'base64');
    if (changes.procedure_id !== undefined) instance.procedure_id = changes.procedure_id;
    await instance.save();
    return instance;
  }

  async remove(instance: Pop) {
    await instance.destroy();
    return instance;
  }
}
