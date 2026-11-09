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
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithUser } from '../../../common/types/request.type';
import { AdminGuard, AuthGuard } from '../../auth/guards';
import { ScheduleCreateGuard } from '../guards/schedule-create.guard';
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
    @UseGuards(AuthGuard, ScheduleCreateGuard)
    async create(@Body() dto: ScheduleCreateDto) {
        return await this.schedulesService.create(dto);
    }

    @Get('my-clients')
    @ApiOperation({
        summary: 'Lista os clientes que têm agendamento com o profissional logado',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async myClients(@Req() request: RequestWithUser) {
        const professional = request.user.professional;
        if (!professional) {
            throw new UnauthorizedException(
                'Apenas profissionais podem acessar esta lista',
            );
        }
        return this.schedulesService.findClientsForProfessional(
            professional.id,
        );
    }

    @Get('my-clients/:clientId/history')
    @ApiOperation({
        summary: 'Lista o histórico do cliente para o profissional logado',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async myClientHistory(
        @Param('clientId', ParseIntPipe) clientId: number,
        @Req() request: RequestWithUser,
    ) {
        const professional = request.user.professional;
        if (!professional) {
            throw new UnauthorizedException(
                'Apenas profissionais podem acessar este histórico',
            );
        }
        return this.schedulesService.findClientHistory(
            professional.id,
            clientId,
        );
    }

    @Get()
    @ApiOperation({ summary: 'Lista agendamentos com filtros opcionais' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async getAll(
        @Query() dto: ScheduleGetAllDto,
        @Req() request: RequestWithUser,
    ) {
        return await this.schedulesService.getAll(dto, request.user);
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
