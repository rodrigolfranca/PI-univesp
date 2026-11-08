import {
    Controller,
    Delete,
    Get,
    HttpException,
    Query,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
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
        @Res() response: Response,
    ) {
        const frontend = this.frontendUrl();
        try {
            await this.googleCalendarService.handleCallback(dto);
            return response.redirect(
                `${frontend}/app/settings?google=connected`,
            );
        } catch (error) {
            const message =
                error instanceof HttpException
                    ? error.message
                    : 'Falha ao conectar a agenda Google';
            return response.redirect(
                `${frontend}/app/settings?google=error&message=${encodeURIComponent(message)}`,
            );
        }
    }

    private frontendUrl(): string {
        const origins = (this.configService.get<string>('CORS_ORIGINS') ?? '')
            .split(',')
            .map((origin) => origin.trim())
            .filter((origin) => origin && origin !== '*');
        return origins[0] ?? 'http://localhost:5173';
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
