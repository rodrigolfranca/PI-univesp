import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthGuard } from '../../auth/guards';
import { ScheduleExceptionsService } from '../services/schedule-exceptions.service';
import { ScheduleExceptionCreateDto } from '../validation/schedule-exception-create.DTO';
import { ScheduleExceptionGetAllDto } from '../validation/schedule-exception-get-all.DTO';
import { ScheduleExceptionUpdateDto } from '../validation/schedule-exception-update.DTO';

@Controller('schedule-exceptions')
@ApiTags('Schedule-Exceptions')
export class ScheduleExceptionsController {
    constructor(
        private readonly scheduleExceptionsService: ScheduleExceptionsService,
    ) {}

    @Post()
    @ApiOperation({
        summary: 'Cria uma exceção de agenda',
        description:
            '"open": deve estar fora do horário de trabalho cadastrado do profissional.\n' +
            '"blocked": deve cobrir um horário de trabalho aberto sem agendamentos existentes.',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async create(@Body() dto: ScheduleExceptionCreateDto) {
        return await this.scheduleExceptionsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Lista exceções de agenda com filtros opcionais' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async getAll(@Query() dto: ScheduleExceptionGetAllDto) {
        return await this.scheduleExceptionsService.getAll(dto);
    }

    @Patch(':id')
    @ApiOperation({
        summary:
            'Atualiza uma exceção de agenda revalidando as regras de negócio',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ScheduleExceptionUpdateDto,
    ) {
        return await this.scheduleExceptionsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Exclui (soft delete) uma exceção de agenda' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async delete(@Param('id', ParseIntPipe) id: number) {
        return await this.scheduleExceptionsService.delete(id);
    }
}
