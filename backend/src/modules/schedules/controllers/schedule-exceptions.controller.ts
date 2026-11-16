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
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithUser } from '../../../common/types/request.type';
import { AuthGuard } from '../../auth/guards';
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
    @UseGuards(AuthGuard)
    async create(
        @Body() dto: ScheduleExceptionCreateDto,
        @Req() request: RequestWithUser,
    ) {
        return await this.scheduleExceptionsService.create(dto, request.user);
    }

    @Get()
    @ApiOperation({ summary: 'Lista exceções de agenda com filtros opcionais' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async getAll(
        @Query() dto: ScheduleExceptionGetAllDto,
        @Req() request: RequestWithUser,
    ) {
        return await this.scheduleExceptionsService.getAll(dto, request.user);
    }

    @Patch(':id')
    @ApiOperation({
        summary:
            'Atualiza uma exceção de agenda revalidando as regras de negócio',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ScheduleExceptionUpdateDto,
        @Req() request: RequestWithUser,
    ) {
        return await this.scheduleExceptionsService.update(
            id,
            dto,
            request.user,
        );
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Exclui (soft delete) uma exceção de agenda' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    async delete(
        @Param('id', ParseIntPipe) id: number,
        @Req() request: RequestWithUser,
    ) {
        return await this.scheduleExceptionsService.delete(id, request.user);
    }
}
