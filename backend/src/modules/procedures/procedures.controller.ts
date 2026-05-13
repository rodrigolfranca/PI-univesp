import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSchema } from '@nestjs/swagger';
import { ProceduresService } from './procedures.service';
import { CreateProcedureDto } from './validation/create-procedure.dto';
import { UpdateProcedureDto } from './validation/update-procedure.dto';

@ApiSchema({ name: 'Procedures', description: 'Endpoints relacionados aos procedimentos' })
@Controller('procedures')
export class ProceduresController {
    constructor(private readonly proceduresService: ProceduresService) { }

    @Post()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cria um novo procedimento' })
    create(@Body() createProcedureDto: CreateProcedureDto) {
        return this.proceduresService.create(createProcedureDto);
    }

    @Get()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Lista todos os procedimentos' })
    findAll() {
        return this.proceduresService.findAll();
    }

    @Get(':id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtém um procedimento' })
    findOne(@Param('id', ParseIntPipe) id: string) {
        return this.proceduresService.findOne(+id);
    }

    @Patch(':id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Atualiza um procedimento' })
    update(@Param('id', ParseIntPipe) id: string, @Body() updateProcedureDto: UpdateProcedureDto) {
        return this.proceduresService.update(+id, updateProcedureDto);
    }

    @Delete(':id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Remove um procedimento' })
    remove(@Param('id', ParseIntPipe) id: string) {
        return this.proceduresService.remove(+id);
    }
}
