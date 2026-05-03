import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Redis } from "ioredis";
import { CryptoService } from "src/common/crypto/crypto.service";
import { User } from "src/common/models";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UsersService,
        private readonly cryptoService: CryptoService,
        private readonly jwtService: JwtService,
        @Inject("REDIS_CLIENT") private readonly redis: Redis,
    ) { }

    async requestCode(phone_number: string) {
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

    async verifyCode(phone_number: string, verification_code: string) {
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

    async signIn(user: User): Promise<{ access_token: string }> {
        const payload = {
            keyType: 'access',
            id: user.id,
            type: user.professional ? 'professional' : 'client',
            is_admin: user.professional?.is_admin
        };

        return { access_token: await this.jwtService.signAsync(payload), };
    }
}
