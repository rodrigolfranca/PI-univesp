import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { CryptoService } from 'src/common/crypto/crypto.service';
import { User } from 'src/common/models';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './types/jwt-payload.interface';
import { LoginRequestCodeDTO } from './validators/login-request-code.DTO';
import { LoginVerifyCodeDTO } from './validators/login-verify-code.DTO';
import { RecoveryRequestCodeDTO } from './validators/recovery-request-code.DTO';
import { RecoveryVerifyCodeDTO } from './validators/recovery-verify-code.DTO';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UsersService,
        private readonly cryptoService: CryptoService,
        private readonly jwtService: JwtService,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) {}

    async requestCode(requestCodeDTO: LoginRequestCodeDTO) {
        const { phone_number } = requestCodeDTO;
        const user = await this.userService.findByPhoneNumber(phone_number);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const code = this.cryptoService.generateCode();
        await this.redis.setex(`auth_code:${phone_number}`, 300, code);

        // Z-API integration to send the code via WhatsApp

        this.logger.log(`Code for ${phone_number}: ${code}`); // For development purposes, log the code

        return { message: 'Code sent successfully' };
    }

    async verifyCode(verifyCodeDTO: LoginVerifyCodeDTO) {
        const { phone_number, verification_code } = verifyCodeDTO;
        const user = await this.userService.findByPhoneNumber(phone_number);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const storedCode = await this.redis.get(`auth_code:${phone_number}`);

        if (!storedCode || storedCode !== verification_code) {
            throw new NotFoundException('Invalid or expired verification code');
        }

        await this.redis.del(`auth_code:${phone_number}`);

        return this.signIn(user);
    }

    async recoveryRequestCode(recoveryRequestCodeDTO: RecoveryRequestCodeDTO) {
        const { email } = recoveryRequestCodeDTO;
        const user = await this.userService.findByEmail(email);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const code = this.cryptoService.generateCode();
        await this.redis.setex(`recovery_code:${email}`, 300, code);

        // Sendgrid integration to send the code via email

        this.logger.log(`Recovery code for ${email}: ${code}`); // For development purposes, log the code

        return { message: 'Recovery code sent successfully' };
    }

    async recoveryVerifyCode(recoveryVerifyCodeDTO: RecoveryVerifyCodeDTO) {
        const { email, phone_number, verification_code } =
            recoveryVerifyCodeDTO;
        const user = await this.userService.findByEmail(email);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const storedCode = await this.redis.get(`recovery_code:${email}`);

        if (!storedCode || storedCode !== verification_code) {
            throw new NotFoundException('Invalid or expired verification code');
        }

        await this.redis.del(`recovery_code:${email}`);
        await this.userService.changePhoneNumber(user.id, phone_number);

        return { message: 'Phone number updated successfully' };
    }

    async signIn(user: User): Promise<{ access_token: string }> {
        const payload: JwtPayload = {
            keyType: 'access',
            id: user.id,
        };

        return { access_token: await this.jwtService.signAsync(payload) };
    }
}
