import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Redis } from 'ioredis';
import { RequestWithUser } from 'src/common/types/request.type';
import { UserWithType } from 'src/common/types/users.type';
import { Utils } from 'src/common/utils/utils';
import { UsersService } from 'src/modules/users/users.service';
import { JwtPayload } from '../types/jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
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

            let user: UserWithType | null = null;

            const cachedUser = await this.redis.get(`user:${data.id}`);
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
                `user:${data.id}`,
                3600,
                JSON.stringify(user),
            );

            (request as unknown as RequestWithUser).user = user;
            return true;
        } catch (e) {
            this.logger.error(`Authentication failed: ${e}`);
            Utils.handleError(e);
        }
    }

    private extractTokenData(token: string): JwtPayload {
        try {
            const payload = this.jwtService.verify<JwtPayload>(token);
            return payload;
        } catch (e) {
            this.logger.error(`Token verification failed: ${e}`);
            throw new UnauthorizedException('Invalid or no token');
        }
    }
}
