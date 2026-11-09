import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpException,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithUser } from '../../common/types/request.type';
import { AdminGuard, AuthGuard } from '../auth/guards';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarCallbackDTO } from './validation/google-calendar-callback.DTO';
import { GoogleCalendarSyncDTO } from './validation/google-calendar-sync.DTO';

@Controller('google-calendar')
@ApiTags('Google-Calendar')
export class GoogleCalendarController {
    constructor(
        private readonly googleCalendarService: GoogleCalendarService,
        private readonly configService: ConfigService,
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
    async callback(
        @Query() dto: GoogleCalendarCallbackDTO,
        @Req() request: Request,
        @Res() response: Response,
    ) {
        const frontend = this.frontendUrl();
        const browser = this.wantsHtml(request);
        try {
            const result = await this.googleCalendarService.handleCallback(dto);
            if (browser) {
                return response.redirect(
                    `${frontend}/app/settings?google=connected`,
                );
            }
            return response.json(result);
        } catch (error) {
            const status =
                error instanceof HttpException ? error.getStatus() : 500;
            const message =
                error instanceof HttpException
                    ? error.message
                    : 'Falha ao conectar a agenda Google';
            if (browser) {
                return response.redirect(
                    `${frontend}/app/settings?google=error&message=${encodeURIComponent(message)}`,
                );
            }
            return response
                .status(status)
                .json({ statusCode: status, message });
        }
    }

    private wantsHtml(request: Request): boolean {
        return (request.headers.accept ?? '').includes('text/html');
    }

    private frontendUrl(): string {
        const origins = (this.configService.get<string>('CORS_ORIGINS') ?? '')
            .split(',')
            .map((origin) => origin.trim())
            .filter((origin) => origin && origin !== '*');
        return origins[0] ?? 'http://localhost:5173';
    }

    @Post('sync')
    @HttpCode(200)
    @ApiOperation({
        summary:
            'Sincroniza um agendamento ou todos os agendamentos com o Google',
    })
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, AdminGuard)
    async sync(@Body() dto: GoogleCalendarSyncDTO) {
        return await this.googleCalendarService.syncSchedules(dto.schedule_id);
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
