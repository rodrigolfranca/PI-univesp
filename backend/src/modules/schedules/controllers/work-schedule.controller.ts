import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithUser } from '../../../common/types/request.type';
import { AuthGuard } from '../../auth/guards';
import { WorkSchedulesService } from '../services/work-schedules.service';
import { WorkScheduleAvailabilityDto } from '../validation/work-schedule-availability.DTO';
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
    @UseGuards(AuthGuard)
    async WorkScheduleCreate(
        @Body() workScheduleCreateDto: WorkScheduleCreateDto,
        @Req() request: RequestWithUser,
    ) {
        return await this.workSchedulesService.create(
            workScheduleCreateDto,
            request.user,
        );
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

    @Get('available-dates')
    @ApiOperation({
        summary: 'Lista datas com disponibilidade para um procedimento',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async availableDates(@Query() dto: WorkScheduleAvailabilityDto) {
        return await this.workSchedulesService.getAvailableDates(dto);
    }

    @Get('availability-summary')
    @ApiOperation({
        summary: 'Resume a próxima disponibilidade por procedimento',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async availabilitySummary(@Query() dto: WorkScheduleAvailabilityDto) {
        return await this.workSchedulesService.getAvailabilitySummary(dto);
    }

    @Get()
    @ApiOperation({
        summary: 'Lista os horários de trabalho cadastrados',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async WorkScheduleFindAll(
        @Query() workScheduleGetAllDto: WorkScheduleGetAllDto,
        @Req() request: RequestWithUser,
    ) {
        return await this.workSchedulesService.findAll(
            workScheduleGetAllDto,
            request.user,
        );
    }

    @Patch('update/:id')
    @ApiOperation({ summary: 'Atualiza um horário de trabalho existente' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async WorkScheduleUpdate(
        @Param('id') id: number,
        @Body() workScheduleUpdateDto: WorkScheduleUpdateDto,
        @Req() request: RequestWithUser,
    ) {
        return await this.workSchedulesService.update(
            id,
            workScheduleUpdateDto,
            request.user,
        );
    }

    @Delete('delete/:id')
    @ApiOperation({ summary: 'Exclui um horário de trabalho' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async WorkScheduleDelete(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
    ) {
        return await this.workSchedulesService.delete(id, request.user);
    }
}
