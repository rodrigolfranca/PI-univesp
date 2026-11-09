import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { Category, Procedure } from '../../../common/models';
import { CreateCategoryDto } from '../validation/create-category.dto';
import { UpdateCategoryDto } from '../validation/update-category.dto';

@Injectable()
export class CategoriesRepository {
    async findAll(): Promise<Category[]> {
        return Category.findAll({ order: [['name', 'ASC']] });
    }

    async findOne(id: number): Promise<Category> {
        const category = await Category.findByPk(id);
        if (!category) {
            throw new NotFoundException(
                `Categoria com id ${id} não encontrada`,
            );
        }
        return category;
    }

    async create(dto: CreateCategoryDto): Promise<Category> {
        const name = dto.name.trim();
        await this.ensureUniqueName(name);
        return Category.create({ name });
    }

    async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
        const category = await this.findOne(id);
        if (dto.name !== undefined) {
            const name = dto.name.trim();
            await this.ensureUniqueName(name, id);
            return category.update({ name });
        }
        return category;
    }

    private async ensureUniqueName(name: string, excludeId?: number) {
        const existing = await Category.findOne({
            where: {
                name,
                ...(excludeId !== undefined && { id: { [Op.ne]: excludeId } }),
            },
        });
        if (existing) {
            throw new BadRequestException('Categoria já cadastrada');
        }
    }

    async remove(id: number): Promise<{ message: string }> {
        const category = await this.findOne(id);
        if (category.name === 'Geral') {
            throw new BadRequestException(
                'A categoria Geral não pode ser excluída',
            );
        }
        const procedures = await Procedure.count({
            where: { category_id: id },
        });
        if (procedures > 0) {
            throw new BadRequestException(
                'Existem procedimentos vinculados a esta categoria',
            );
        }
        await category.destroy();
        return { message: 'Categoria removida com sucesso' };
    }
}
