import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { CryptoModule } from "src/common/crypto/crypto.module";
import { RedisModule } from "src/common/redis/redis.module";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
    imports: [
        JwtModule.registerAsync({
            global: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.getOrThrow<string>("JWT_SECRET"),
                signOptions: { expiresIn: '60s' },
            }),
        }),
        UsersModule,
        CryptoModule,
        RedisModule
    ],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule { }
