import { Controller, Delete, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithUser } from 'src/common/types/request.type';
import { AdminGuard, AuthGuard } from '../auth/guards';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarCallbackDTO } from './validation/google-calendar-callback.DTO';

@Controller('google-calendar')
@ApiTags('Google-Calendar')
export class GoogleCalendarController {
    constructor(
        private readonly googleCalendarService: GoogleCalendarService,
    ) {}

    @Get('connect')
    @ApiOperation({
        summary:
            'Gera o link para o admin autorizar o acesso à sua agenda Google',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async connect(@Req() request: RequestWithUser) {
        return await this.googleCalendarService.getConnectUrl(
            request.user.professional!.id,
        );
    }

    @Get('callback')
    @ApiOperation({
        summary:
            'Recebe o redirecionamento do Google e salva a conexão (chamada pelo Google, não pelo front)',
    })
    async callback(@Query() dto: GoogleCalendarCallbackDTO) {
        return await this.googleCalendarService.handleCallback(dto);
    }

    @Get('status')
    @ApiOperation({ summary: 'Informa se há uma agenda Google conectada' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async status() {
        return await this.googleCalendarService.getStatus();
    }

    @Delete('disconnect')
    @ApiOperation({ summary: 'Desconecta a agenda Google do admin' })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async disconnect() {
        return await this.googleCalendarService.disconnect();
    }
}
