import { Injectable, NotFoundException } from '@nestjs/common';
import { Procedure } from 'src/common/models';
import { CreateProcedureDto } from '../validation/create-procedure.dto';
import { UpdateProcedureDto } from '../validation/update-procedure.dto';

@Injectable()
export class ProceduresRepository {
    async findAll(): Promise<Procedure[]> {
        return Procedure.findAll();
    }

    async findOne(id: number): Promise<Procedure> {
        const procedure = await Procedure.findByPk(id);
        if (!procedure) {
            throw new NotFoundException(
                `Procedimento com id ${id} não encontrado`,
            );
        }
        return procedure;
    }

    async create(dto: CreateProcedureDto): Promise<Procedure> {
        return Procedure.create({ ...dto });
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
