import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
    ThrottlerGetTrackerFunction,
    ThrottlerGuard,
    ThrottlerModule,
} from '@nestjs/throttler';
import { CryptoModule } from 'src/common/crypto/crypto.module';
import { RedisModule } from '../../common/redis/redis.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminGuard, AuthGuard } from './guards';

const authThrottleTracker: ThrottlerGetTrackerFunction = (req) => {
    const request = req as {
        ip?: string;
        socket?: { remoteAddress?: string };
        body?: { phone_number?: string; email?: string };
    };
    const ip = request.ip ?? request.socket?.remoteAddress ?? 'unknown';
    const identity =
        request.body?.email ?? request.body?.phone_number ?? 'anonymous';

    return `${ip}:${identity}`;
};

@Module({
    imports: [
        JwtModule.registerAsync({
            global: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.getOrThrow<string>('JWT_SECRET'),
                signOptions: { expiresIn: '2d' },
            }),
        }),
        UsersModule,
        CryptoModule,
        RedisModule,
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => [
                {
                    name: 'auth',
                    ttl:
                        configService.get<number>('AUTH_THROTTLE_TTL_MS') ??
                        60000,
                    limit:
                        configService.get<number>('AUTH_THROTTLE_LIMIT') ?? 10,
                    getTracker: authThrottleTracker,
                },
            ],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthGuard, AdminGuard, ThrottlerGuard],
    exports: [AuthService, AuthGuard, AdminGuard],
})
export class AuthModule {}
