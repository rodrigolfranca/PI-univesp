import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { RequestWithUser } from 'src/common/types/request.type';
import { RATE_LIMIT_METADATA, RateLimitOptions } from './rate-limit.decorator';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly rateLimitService: RateLimitService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const options = this.reflector.getAllAndOverride<RateLimitOptions>(
            RATE_LIMIT_METADATA,
            [context.getHandler(), context.getClass()],
        );
        if (!options) return true;

        const http = context.switchToHttp();
        const request = http.getRequest<Request & Partial<RequestWithUser>>();
        const response = http.getResponse<Response>();
        const limit = options.limit ?? this.rateLimitService.authLimit;
        const windowMs = options.windowMs ?? this.rateLimitService.authWindowMs;
        const result = await this.rateLimitService.consume(
            options.bucket,
            this.subjectFor(request, options.key ?? 'identity'),
            limit,
            windowMs,
        );

        response.setHeader('X-RateLimit-Limit', limit);
        response.setHeader(
            'X-RateLimit-Remaining',
            Math.max(0, result.remaining),
        );
        response.setHeader(
            'X-RateLimit-Reset',
            Math.ceil(result.resetAt / 1000),
        );

        if (!result.success) {
            response.setHeader(
                'Retry-After',
                Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)),
            );
            throw new HttpException(
                'Too Many Requests',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        return true;
    }

    private subjectFor(
        request: Request & Partial<RequestWithUser>,
        key: RateLimitOptions['key'],
    ): string {
        const ip = request.ip ?? request.socket?.remoteAddress ?? 'unknown';

        if (key === 'user') {
            return request.user?.id ? `user:${request.user.id}` : `ip:${ip}`;
        }
        if (key === 'ip') return `ip:${ip}`;

        const body = request.body as
            | { email?: unknown; phone_number?: unknown }
            | undefined;
        const identity =
            (typeof body?.email === 'string' && body.email) ||
            (typeof body?.phone_number === 'string' && body.phone_number) ||
            'anonymous';
        return `ip:${ip}:${identity}`;
    }
}
