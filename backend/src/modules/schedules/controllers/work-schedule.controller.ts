import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthGuard } from '../../auth/guards';
import { WorkSchedulesService } from '../services/work-schedules.service';
import { WorkScheduleCreateDto } from '../validation/work-schedule-create.DTO';
import { WorkScheduleGetAllDto } from '../validation/work-schedule-get-all.DTO';
import { WorkScheduleUpdateDto } from '../validation/work-schedule-update.DTO';

@Controller('work-schedules')
@ApiTags('Work-Schedules')
export class WorkScheduleController {
    constructor(private readonly workSchedulesService: WorkSchedulesService) {}

    @Post()
    @ApiOperation({
        summary: 'Cria um horário de trabalho para um profissional',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async WorkScheduleCreate(
        @Body() workScheduleCreateDto: WorkScheduleCreateDto,
    ) {
        return await this.workSchedulesService.create(workScheduleCreateDto);
    }

    @Get('all')
    @ApiOperation({
        summary: 'Retorna a agenda disponível para todos os profissionais',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async WorkScheduleGetAll(
        @Query() workScheduleGetAllDto: WorkScheduleGetAllDto,
    ) {
        return await this.workSchedulesService.getAll(workScheduleGetAllDto);
    }

    @Patch('update/:id')
    @ApiOperation({ summary: 'Atualiza um horário de trabalho existente' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async WorkScheduleUpdate(
        @Param('id') id: number,
        @Body() workScheduleUpdateDto: WorkScheduleUpdateDto,
    ) {
        return await this.workSchedulesService.update(
            id,
            workScheduleUpdateDto,
        );
    }

    @Delete('delete/:id')
    @ApiOperation({ summary: 'Exclui um horário de trabalho' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async WorkScheduleDelete(@Param('id') id: number) {
        return await this.workSchedulesService.delete(id);
    }
}
