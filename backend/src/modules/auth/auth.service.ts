import {
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { Redis } from 'ioredis';
import { CryptoService } from 'src/common/crypto/crypto.service';
import { redisKey } from 'src/common/redis/redis-keys';
import { User } from 'src/common/models';
import { Utils } from 'src/common/utils/utils';
import { UsersService } from '../users/users.service';
import { ACCESS_TOKEN_TTL_SECONDS, sessionKey } from './session-key';
import { JwtPayload } from './types/jwt-payload.interface';
import { LoginRequestCodeDTO } from './validation/login-request-code.DTO';
import { LoginVerifyCodeDTO } from './validation/login-verify-code.DTO';
import { RecoveryRequestCodeDTO } from './validation/recovery-request-code.DTO';
import { RecoveryVerifyCodeDTO } from './validation/recovery-verify-code.DTO';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UsersService,
        private readonly cryptoService: CryptoService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) {}

    private get siteId() {
        return this.configService.get<string>('SITE_ID');
    }

    async requestCode(requestCodeDTO: LoginRequestCodeDTO) {
        try {
            const { phone_number } = requestCodeDTO;
            const user = await this.userService.findByPhoneNumber(phone_number);

            if (!user) {
                this.logger.warn(
                    `User with phone number ${phone_number} not found.`,
                );
                return {
                    message:
                        'If the phone number is registered, a code was sent',
                };
            }

            const code = this.cryptoService.generateCode();
            await this.redis.setex(
                redisKey(this.siteId, 'auth_code', phone_number),
                300,
                code,
            );

            // Z-API integration to send the code via WhatsApp

            this.logger.log(`Code for ${phone_number}: ${code}`); // For development purposes, log the code

            return {
                message: 'If the phone number is registered, a code was sent',
            };
        } catch (e) {
            Utils.logError(this.logger, 'Failed to request code', e);
            Utils.handleError(e);
        }
    }

    async verifyCode(verifyCodeDTO: LoginVerifyCodeDTO) {
        try {
            const { phone_number, verification_code } = verifyCodeDTO;
            const user = await this.userService.findByPhoneNumber(phone_number);

            if (!user) {
                throw new UnauthorizedException(
                    'Invalid or expired verification code',
                );
            }

            const storedCode = await this.redis.get(
                redisKey(this.siteId, 'auth_code', phone_number),
            );

            if (!storedCode || storedCode !== verification_code) {
                throw new UnauthorizedException(
                    'Invalid or expired verification code',
                );
            }

            await this.redis.del(
                redisKey(this.siteId, 'auth_code', phone_number),
            );

            return this.signIn(user);
        } catch (e) {
            Utils.logError(this.logger, 'Failed to verify code', e);
            Utils.handleError(e);
        }
    }

    async recoveryRequestCode(recoveryRequestCodeDTO: RecoveryRequestCodeDTO) {
        try {
            const { email } = recoveryRequestCodeDTO;
            const user = await this.userService.findByEmail(email);

            if (!user) {
                this.logger.warn(`User with email ${email} not found.`);
                return {
                    message:
                        'If the email is registered, a recovery code was sent',
                };
            }

            const code = this.cryptoService.generateCode();
            await this.redis.setex(
                redisKey(this.siteId, 'recovery_code', email),
                300,
                code,
            );

            const recipient = recoveryRequestCodeDTO.phone_number ?? email;
            this.logger.log(`Recovery code for ${recipient}: ${code}`);

            return {
                message: 'If the email is registered, a recovery code was sent',
            };
        } catch (e) {
            Utils.logError(this.logger, 'Failed to request recovery code', e);
            Utils.handleError(e);
        }
    }

    async recoveryVerifyCode(recoveryVerifyCodeDTO: RecoveryVerifyCodeDTO) {
        try {
            const { email, phone_number, verification_code } =
                recoveryVerifyCodeDTO;
            const user = await this.userService.findByEmail(email);

            if (!user) {
                this.logger.warn(`User with email ${email} not found.`);
                throw new UnauthorizedException(
                    'Invalid or expired verification code',
                );
            }

            const storedCode = await this.redis.get(
                redisKey(this.siteId, 'recovery_code', email),
            );

            if (!storedCode || storedCode !== verification_code) {
                throw new UnauthorizedException(
                    'Invalid or expired verification code',
                );
            }

            await this.redis.del(
                redisKey(this.siteId, 'recovery_code', email),
            );
            await this.userService.changePhoneNumber(user.id, phone_number);

            return { message: 'Phone number updated successfully' };
        } catch (e) {
            Utils.logError(this.logger, 'Failed to verify recovery code', e);
            Utils.handleError(e);
        }
    }

    async signIn(user: User): Promise<{ access_token: string }> {
        const jti = randomUUID();
        await this.redis.setex(
            sessionKey(this.siteId, jti),
            ACCESS_TOKEN_TTL_SECONDS,
            String(user.id),
        );
        const payload: JwtPayload = {
            keyType: 'access',
            id: user.id,
            jti,
        };

        return { access_token: await this.jwtService.signAsync(payload) };
    }

    async logout(jti: string): Promise<{ message: string }> {
        await this.redis.del(sessionKey(this.siteId, jti));
        return { message: 'Logged out' };
    }
}
