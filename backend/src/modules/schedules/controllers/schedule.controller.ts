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
import { SchedulesService } from '../services/schedules.service';
import { ScheduleCreateDto } from '../validation/schedule-create.DTO';
import { ScheduleGetAllDto } from '../validation/schedule-get-all.DTO';
import { ScheduleUpdateDto } from '../validation/schedule-update.DTO';

@Controller('schedules')
@ApiTags('Schedules')
export class ScheduleController {
    constructor(private readonly schedulesService: SchedulesService) {}

    @Post()
    @ApiOperation({
        summary:
            'Cria um agendamento validando disponibilidade do profissional',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async create(@Body() dto: ScheduleCreateDto) {
        return await this.schedulesService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Lista agendamentos com filtros opcionais' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async getAll(@Query() dto: ScheduleGetAllDto) {
        return await this.schedulesService.getAll(dto);
    }

    @Patch(':id')
    @ApiOperation({
        summary:
            'Atualiza um agendamento revalidando disponibilidade se o horário mudar',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ScheduleUpdateDto,
    ) {
        return await this.schedulesService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Exclui (soft delete) um agendamento' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async delete(@Param('id', ParseIntPipe) id: number) {
        return await this.schedulesService.delete(id);
    }
}
