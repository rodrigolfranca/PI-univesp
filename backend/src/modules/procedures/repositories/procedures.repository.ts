import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Transaction } from 'sequelize';
import { ProcedureStatus } from '../../../common/consts/procedure.status';
import {
    Category,
    Procedure,
    ProcedureProfessional,
    Professional,
    User,
} from '../../../common/models';
import { CreateProcedureDto } from '../validation/create-procedure.dto';
import { UpdateProcedureDto } from '../validation/update-procedure.dto';

export interface ProfessionalResponse {
    id: number;
    name: string;
}

export type ProcedureResponse = Record<string, unknown> & {
    professionals: ProfessionalResponse[];
};

@Injectable()
export class ProceduresRepository {
    async findAll(): Promise<ProcedureResponse[]> {
        const procedures = await Procedure.findAll({
            include: [
                { model: Category, as: 'category' },
                {
                    model: Professional,
                    as: 'professionals',
                    through: { attributes: [] },
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name'],
                        },
                    ],
                },
            ],
        });
        return procedures.map((procedure) => this.toResponse(procedure));
    }

    async findOne(id: number): Promise<ProcedureResponse> {
        return this.toResponse(await this.findModel(id));
    }

    private async findModel(id: number): Promise<Procedure> {
        const procedure = await Procedure.findByPk(id, {
            include: [
                { model: Category, as: 'category' },
                {
                    model: Professional,
                    as: 'professionals',
                    through: { attributes: [] },
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name'],
                        },
                    ],
                },
            ],
        });
        if (!procedure) {
            throw new NotFoundException(
                `Procedimento com id ${id} não encontrado`,
            );
        }
        return procedure;
    }

    async create(dto: CreateProcedureDto): Promise<ProcedureResponse> {
        const transaction = await Procedure.sequelize!.transaction();

        try {
            const { professional_ids, ...fields } = dto;
            const professionals = await this.resolveProfessionals(
                professional_ids,
                transaction,
            );
            const category_id =
                dto.category_id ?? (await this.generalCategoryId());
            const procedure = await Procedure.create(
                {
                    ...fields,
                    category_id,
                    status: dto.status ?? ProcedureStatus.ACTIVE,
                },
                { transaction },
            );
            await procedure.$set('professionals', professionals, {
                transaction,
            });
            await transaction.commit();
            return await this.findOne(procedure.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private async generalCategoryId(): Promise<number> {
        const [category] = await Category.findOrCreate({
            where: { name: 'Geral' },
            defaults: { name: 'Geral' },
        });
        return category.id;
    }

    private async resolveProfessionals(
        ids: number[],
        transaction?: Transaction,
    ): Promise<Professional[]> {
        const uniqueIds = [...new Set(ids)];
        const professionals = await Professional.findAll({
            where: { id: uniqueIds },
            transaction,
        });
        if (professionals.length !== uniqueIds.length) {
            throw new BadRequestException(
                'Um ou mais profissionais informados não foram encontrados',
            );
        }
        return professionals;
    }

    async update(
        id: number,
        dto: UpdateProcedureDto,
    ): Promise<ProcedureResponse> {
        const procedure = await this.findModel(id);
        const transaction = await Procedure.sequelize!.transaction();

        try {
            const { professional_ids, ...fields } = dto;
            if (Object.keys(fields).length > 0) {
                await procedure.update(fields, { transaction });
            }
            if (professional_ids !== undefined) {
                const professionals = await this.resolveProfessionals(
                    professional_ids,
                    transaction,
                );
                await procedure.$set('professionals', professionals, {
                    transaction,
                });
            }
            await transaction.commit();
            return await this.findOne(id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async remove(id: number): Promise<{ message: string }> {
        const procedure = await this.findModel(id);
        const transaction = await Procedure.sequelize!.transaction();

        try {
            await ProcedureProfessional.destroy({
                where: { procedure_id: id },
                transaction,
            });
            await procedure.destroy({ transaction });
            await transaction.commit();
            return { message: 'Procedimento removido com sucesso' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private toResponse(procedure: Procedure): ProcedureResponse {
        const plain = procedure.get({ plain: true }) as Record<
            string,
            unknown
        > & {
            professionals?: Array<{
                id: number;
                user?: { name?: string | null };
            }>;
        };
        return {
            ...plain,
            professionals: (plain.professionals ?? []).map((professional) => ({
                id: professional.id,
                name:
                    professional.user?.name ??
                    `Profissional ${professional.id}`,
            })),
        };
    }
}
