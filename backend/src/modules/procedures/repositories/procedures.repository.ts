import { Injectable, NotFoundException } from '@nestjs/common';
import { ProcedureStatus } from '../../../common/consts/procedure.status';
import { Category, Procedure } from '../../../common/models';
import { CreateProcedureDto } from '../validation/create-procedure.dto';
import { UpdateProcedureDto } from '../validation/update-procedure.dto';

@Injectable()
export class ProceduresRepository {
    async findAll(): Promise<Procedure[]> {
        return Procedure.findAll({
            include: [{ model: Category, as: 'category' }],
        });
    }

    async findOne(id: number): Promise<Procedure> {
        const procedure = await Procedure.findByPk(id, {
            include: [{ model: Category, as: 'category' }],
        });
        if (!procedure) {
            throw new NotFoundException(
                `Procedimento com id ${id} não encontrado`,
            );
        }
        return procedure;
    }

    async create(dto: CreateProcedureDto): Promise<Procedure> {
        const category_id = dto.category_id ?? (await this.generalCategoryId());
        return Procedure.create({
            ...dto,
            category_id,
            status: dto.status ?? ProcedureStatus.ACTIVE,
        });
    }

    private async generalCategoryId(): Promise<number> {
        const [category] = await Category.findOrCreate({
            where: { name: 'Geral' },
            defaults: { name: 'Geral' },
        });
        return category.id;
    }

    async update(id: number, dto: UpdateProcedureDto): Promise<Procedure> {
        const procedure = await this.findOne(id);
        return procedure.update(dto);
    }

    async remove(id: number): Promise<{ message: string }> {
        const procedure = await this.findOne(id);
        await procedure.destroy();
        return { message: 'Procedimento removido com sucesso' };
    }
}
