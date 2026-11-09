import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Redis } from 'ioredis';
import { redisKey } from '../../../common/redis/redis-keys';
import { RequestWithUser } from '../../../common/types/request.type';
import { UserWithType } from '../../../common/types/users.type';
import { Utils } from '../../../common/utils/utils';
import { UsersService } from '../../users/users.service';
import { sessionKey } from '../session-key';
import { JwtPayload } from '../types/jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) {}

    logger = new Logger(AuthGuard.name);

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest<Request>();
            const token = request.headers.authorization?.split(' ')[1];

            if (!token) {
                throw new UnauthorizedException('Invalid or no token');
            }

            const data = this.extractTokenData(token);
            if (!data.jti) {
                throw new UnauthorizedException('Invalid or no token');
            }

            const sessionUserId = await this.redis.get(
                sessionKey(this.configService.get<string>('SITE_ID'), data.jti),
            );
            if (!sessionUserId || Number(sessionUserId) !== data.id) {
                throw new UnauthorizedException('Invalid or no token');
            }

            let user: UserWithType | null = null;

            const siteId = this.configService.get<string>('SITE_ID');
            const userCacheKey = redisKey(siteId, 'user', data.id);
            const cachedUser = await this.redis.get(userCacheKey);
            if (cachedUser) {
                user = JSON.parse(cachedUser) as UserWithType;
            }

            if (!user) {
                user =
                    (await this.usersService.findById(data.id))?.toJSON() ??
                    null;
            }

            if (!user) {
                throw new UnauthorizedException('Invalid or no token');
            }

            await this.redis.setex(
                userCacheKey,
                3600,
                JSON.stringify(user),
            );

            const authenticatedRequest = request as unknown as RequestWithUser;
            authenticatedRequest.user = user;
            authenticatedRequest.sessionJti = data.jti;
            return true;
        } catch (e) {
            Utils.logError(this.logger, 'Authentication failed', e);
            Utils.handleError(e);
        }
    }

    private extractTokenData(token: string): JwtPayload {
        try {
            const payload = this.jwtService.verify<JwtPayload>(token);
            return payload;
        } catch (e) {
            Utils.logError(this.logger, 'Token verification failed', e);
            throw new UnauthorizedException('Invalid or no token');
        }
    }
}
