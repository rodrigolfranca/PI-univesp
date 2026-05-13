import { Injectable } from '@nestjs/common';
import { ProceduresRepository } from './repositories/procedures.repository';
import { CreateProcedureDto } from './validation/create-procedure.dto';
import { UpdateProcedureDto } from './validation/update-procedure.dto';

@Injectable()
export class ProceduresService {
    constructor(private readonly proceduresRepository: ProceduresRepository) { }

    findAll() {
        return this.proceduresRepository.findAll();
    }

    findOne(id: number) {
        return this.proceduresRepository.findOne(id);
    }

    create(dto: CreateProcedureDto) {
        return this.proceduresRepository.create(dto);
    }

    update(id: number, dto: UpdateProcedureDto) {
        return this.proceduresRepository.update(id, dto);
    }

    remove(id: number) {
        return this.proceduresRepository.remove(id);
    }
}
