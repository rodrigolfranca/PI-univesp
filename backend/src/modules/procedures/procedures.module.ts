import { Module } from '@nestjs/common';
import { ProceduresController } from './procedures.controller';
import { ProceduresService } from './procedures.service';
import { ProceduresRepository } from './repositories/procedures.repository';

@Module({
    controllers: [ProceduresController],
    providers: [ProceduresService, ProceduresRepository],
})
export class ProceduresModule {}
