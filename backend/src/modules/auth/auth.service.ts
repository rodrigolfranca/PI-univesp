import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { Redis } from 'ioredis';
import { CryptoService } from '../../common/crypto/crypto.service';
import {
    OTP_RESEND_AFTER_SECONDS,
    OTP_TTL_SECONDS,
    RECOVERY_SESSION_TTL_SECONDS,
    SIGNUP_SESSION_TTL_SECONDS,
} from '../../common/otp/otp.constants';
import { redisKey } from '../../common/redis/redis-keys';
import { User } from '../../common/models';
import { Utils } from '../../common/utils/utils';
import { UsersService } from '../users/users.service';
import { ACCESS_TOKEN_TTL_SECONDS, sessionKey } from './session-key';
import { JwtPayload } from './types/jwt-payload.interface';
import { LoginRequestCodeDTO } from './validation/login-request-code.DTO';
import { LoginVerifyCodeDTO } from './validation/login-verify-code.DTO';
import { RecoveryRequestEmailCodeDTO } from './validation/recovery-request-email-code.DTO';
import { RecoveryVerifyEmailCodeDTO } from './validation/recovery-verify-email-code.DTO';
import { RecoveryRequestPhoneCodeDTO } from './validation/recovery-request-phone-code.DTO';
import { RecoveryVerifyPhoneCodeDTO } from './validation/recovery-verify-phone-code.DTO';
import { SignupRequestCodeDTO } from './validation/signup-request-code.DTO';
import { SignupResendCodeDTO } from './validation/signup-resend-code.DTO';
import { SignupVerifyEmailCodeDTO } from './validation/signup-verify-email-code.DTO';
import { SignupResendPhoneCodeDTO } from './validation/signup-resend-phone-code.DTO';
import { SignupVerifyPhoneCodeDTO } from './validation/signup-verify-phone-code.DTO';

interface SignupData {
    name: string;
    phone_number: string;
    email: string;
    emailVerified: boolean;
}

interface RecoverySession {
    email: string;
    userId: number;
    emailVerified: boolean;
    phoneNumber?: string;
}

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

    private signupKey(signupId: string, part: 'data' | 'phone' | 'email') {
        return redisKey(this.siteId, 'signup', signupId, part);
    }

    private recoveryKey(recoveryId: string, part: 'data' | 'email' | 'phone') {
        return redisKey(this.siteId, 'recovery', recoveryId, part);
    }

    private parseJson<T>(value: string | null): T | null {
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch {
            return null;
        }
    }

    private async storeSignupData(signupId: string, data: SignupData) {
        await this.redis.setex(
            this.signupKey(signupId, 'data'),
            SIGNUP_SESSION_TTL_SECONDS,
            JSON.stringify(data),
        );
    }

    async signupRequestCode(signupRequestCodeDTO: SignupRequestCodeDTO) {
        try {
            const data: SignupData = {
                name: signupRequestCodeDTO.name.trim(),
                phone_number: signupRequestCodeDTO.phone_number,
                email: signupRequestCodeDTO.email.trim(),
                emailVerified: false,
            };

            if (await this.userService.findByPhoneNumber(data.phone_number)) {
                throw new BadRequestException(
                    'Este telefone já está cadastrado em outra conta.',
                );
            }

            if (await this.userService.findByEmail(data.email)) {
                throw new BadRequestException(
                    'Este e-mail já está cadastrado em outra conta.',
                );
            }

            const signupId = randomUUID();
            const emailCode = this.cryptoService.generateCode();
            await this.storeSignupData(signupId, data);
            await this.redis.setex(
                this.signupKey(signupId, 'email'),
                OTP_TTL_SECONDS,
                emailCode,
            );
            this.logger.log(
                `Signup email code for ${data.email}: ${emailCode}`,
            );

            return {
                message: 'Código enviado ao e-mail',
                signup_id: signupId,
                expires_in: OTP_TTL_SECONDS,
                resend_after: OTP_RESEND_AFTER_SECONDS,
            };
        } catch (e) {
            Utils.logError(this.logger, 'Failed to request signup code', e);
            Utils.handleError(e);
        }
    }

    async signupResendCode(signupResendCodeDTO: SignupResendCodeDTO) {
        try {
            const signupId = signupResendCodeDTO.signup_id;
            const data = this.parseJson<SignupData>(
                await this.redis.get(this.signupKey(signupId, 'data')),
            );
            if (!data || data.emailVerified) {
                throw new UnauthorizedException(
                    'Cadastro expirado. Preencha os dados novamente.',
                );
            }

            const emailCode = this.cryptoService.generateCode();
            await this.storeSignupData(signupId, data);
            await this.redis.setex(
                this.signupKey(signupId, 'email'),
                OTP_TTL_SECONDS,
                emailCode,
            );
            this.logger.log(
                `Signup email code for ${data.email}: ${emailCode}`,
            );

            return {
                message: 'Código enviado ao e-mail',
                signup_id: signupId,
                expires_in: OTP_TTL_SECONDS,
                resend_after: OTP_RESEND_AFTER_SECONDS,
            };
        } catch (e) {
            Utils.logError(this.logger, 'Failed to resend signup code', e);
            Utils.handleError(e);
        }
    }

    async signupVerifyEmailCode(
        signupVerifyEmailCodeDTO: SignupVerifyEmailCodeDTO,
    ) {
        try {
            const signupId = signupVerifyEmailCodeDTO.signup_id;
            const [dataValue, storedCode] = await Promise.all([
                this.redis.get(this.signupKey(signupId, 'data')),
                this.redis.get(this.signupKey(signupId, 'email')),
            ]);
            const data = this.parseJson<SignupData>(dataValue);

            if (
                !data ||
                data.emailVerified ||
                !storedCode ||
                storedCode !== signupVerifyEmailCodeDTO.email_code
            ) {
                throw new UnauthorizedException('Código inválido ou expirado');
            }

            const verified: SignupData = { ...data, emailVerified: true };
            const phoneCode = this.cryptoService.generateCode();
            await this.redis.del(this.signupKey(signupId, 'email'));
            await this.storeSignupData(signupId, verified);
            await this.redis.setex(
                this.signupKey(signupId, 'phone'),
                OTP_TTL_SECONDS,
                phoneCode,
            );
            this.logger.log(
                `Signup phone code for ${data.phone_number}: ${phoneCode}`,
            );

            return {
                message: 'E-mail confirmado',
                signup_id: signupId,
                expires_in: OTP_TTL_SECONDS,
                resend_after: OTP_RESEND_AFTER_SECONDS,
            };
        } catch (e) {
            Utils.logError(
                this.logger,
                'Failed to verify signup email code',
                e,
            );
            Utils.handleError(e);
        }
    }

    async signupResendPhoneCode(
        signupResendPhoneCodeDTO: SignupResendPhoneCodeDTO,
    ) {
        try {
            const signupId = signupResendPhoneCodeDTO.signup_id;
            const data = this.parseJson<SignupData>(
                await this.redis.get(this.signupKey(signupId, 'data')),
            );
            if (!data || !data.emailVerified) {
                throw new UnauthorizedException('Confirme o e-mail primeiro');
            }

            const phoneCode = this.cryptoService.generateCode();
            await this.storeSignupData(signupId, data);
            await this.redis.setex(
                this.signupKey(signupId, 'phone'),
                OTP_TTL_SECONDS,
                phoneCode,
            );
            this.logger.log(
                `Signup phone code for ${data.phone_number}: ${phoneCode}`,
            );

            return {
                message: 'Código enviado ao telefone',
                signup_id: signupId,
                expires_in: OTP_TTL_SECONDS,
                resend_after: OTP_RESEND_AFTER_SECONDS,
            };
        } catch (e) {
            Utils.logError(
                this.logger,
                'Failed to resend signup phone code',
                e,
            );
            Utils.handleError(e);
        }
    }

    async signupVerifyPhoneCode(
        signupVerifyPhoneCodeDTO: SignupVerifyPhoneCodeDTO,
    ) {
        try {
            const signupId = signupVerifyPhoneCodeDTO.signup_id;
            const [dataValue, storedCode] = await Promise.all([
                this.redis.get(this.signupKey(signupId, 'data')),
                this.redis.get(this.signupKey(signupId, 'phone')),
            ]);
            const data = this.parseJson<SignupData>(dataValue);

            if (
                !data ||
                !data.emailVerified ||
                !storedCode ||
                storedCode !== signupVerifyPhoneCodeDTO.phone_code
            ) {
                throw new UnauthorizedException('Código inválido ou expirado');
            }

            await this.userService.createVerifiedClient({
                name: data.name,
                phone_number: data.phone_number,
                email: data.email,
            });
            await this.redis.del(
                this.signupKey(signupId, 'data'),
                this.signupKey(signupId, 'email'),
                this.signupKey(signupId, 'phone'),
            );

            return { message: 'Cadastro confirmado com sucesso' };
        } catch (e) {
            Utils.logError(
                this.logger,
                'Failed to verify signup phone code',
                e,
            );
            Utils.handleError(e);
        }
    }

    async requestCode(requestCodeDTO: LoginRequestCodeDTO) {
        try {
            const { phone_number } = requestCodeDTO;
            const user = await this.userService.findByPhoneNumber(phone_number);

            if (!user) {
                this.logger.warn(
                    `User with phone number ${phone_number} not found.`,
                );
                throw new NotFoundException('Telefone não cadastrado');
            }

            const code = this.cryptoService.generateCode();
            await this.redis.setex(
                redisKey(this.siteId, 'auth_code', phone_number),
                OTP_TTL_SECONDS,
                code,
            );

            // Codes are logged while no delivery provider is configured.

            this.logger.log(`Code for ${phone_number}: ${code}`);

            return {
                message: 'If the phone number is registered, a code was sent',
                expires_in: OTP_TTL_SECONDS,
                resend_after: OTP_RESEND_AFTER_SECONDS,
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
            await this.userService.markPhoneConfirmed(user.id);

            return this.signIn(user);
        } catch (e) {
            Utils.logError(this.logger, 'Failed to verify code', e);
            Utils.handleError(e);
        }
    }

    async recoveryRequestEmailCode(
        recoveryRequestEmailCodeDTO: RecoveryRequestEmailCodeDTO,
    ) {
        try {
            const email = recoveryRequestEmailCodeDTO.email.trim();
            const user = await this.userService.findByEmail(email);

            if (!user) {
                this.logger.warn(`User with email ${email} not found.`);
                throw new NotFoundException(
                    'Não encontramos uma conta com este e-mail',
                );
            }

            const recoveryId = randomUUID();
            const emailCode = this.cryptoService.generateCode();
            const data: RecoverySession = {
                email,
                userId: user.id,
                emailVerified: false,
            };

            await this.redis.setex(
                this.recoveryKey(recoveryId, 'data'),
                RECOVERY_SESSION_TTL_SECONDS,
                JSON.stringify(data),
            );
            await this.redis.setex(
                this.recoveryKey(recoveryId, 'email'),
                OTP_TTL_SECONDS,
                emailCode,
            );

            this.logger.log(`Recovery email code for ${email}: ${emailCode}`);

            return {
                message: 'Código enviado ao e-mail',
                recovery_id: recoveryId,
                expires_in: OTP_TTL_SECONDS,
                resend_after: OTP_RESEND_AFTER_SECONDS,
            };
        } catch (e) {
            Utils.logError(
                this.logger,
                'Failed to request recovery email code',
                e,
            );
            Utils.handleError(e);
        }
    }

    async recoveryVerifyEmailCode(
        recoveryVerifyEmailCodeDTO: RecoveryVerifyEmailCodeDTO,
    ) {
        try {
            const recoveryId = recoveryVerifyEmailCodeDTO.recovery_id;
            const [dataValue, storedCode] = await Promise.all([
                this.redis.get(this.recoveryKey(recoveryId, 'data')),
                this.redis.get(this.recoveryKey(recoveryId, 'email')),
            ]);
            const data = this.parseJson<RecoverySession>(dataValue);

            if (
                !data ||
                !storedCode ||
                storedCode !== recoveryVerifyEmailCodeDTO.email_code
            ) {
                throw new UnauthorizedException('Código inválido ou expirado');
            }

            const verified: RecoverySession = {
                ...data,
                emailVerified: true,
            };
            await this.redis.del(this.recoveryKey(recoveryId, 'email'));
            await this.redis.setex(
                this.recoveryKey(recoveryId, 'data'),
                RECOVERY_SESSION_TTL_SECONDS,
                JSON.stringify(verified),
            );

            return {
                message: 'E-mail confirmado',
                recovery_id: recoveryId,
            };
        } catch (e) {
            Utils.logError(
                this.logger,
                'Failed to verify recovery email code',
                e,
            );
            Utils.handleError(e);
        }
    }

    async recoveryRequestPhoneCode(
        recoveryRequestPhoneCodeDTO: RecoveryRequestPhoneCodeDTO,
    ) {
        try {
            const recoveryId = recoveryRequestPhoneCodeDTO.recovery_id;
            const phoneNumber = recoveryRequestPhoneCodeDTO.phone_number;
            const data = this.parseJson<RecoverySession>(
                await this.redis.get(this.recoveryKey(recoveryId, 'data')),
            );

            if (!data || !data.emailVerified) {
                throw new UnauthorizedException('Confirme o e-mail primeiro');
            }

            const user = await this.userService.findById(data.userId);
            if (!user) {
                throw new UnauthorizedException('Código inválido ou expirado');
            }

            if (phoneNumber === user.phone_number) {
                throw new BadRequestException(
                    'Este é o telefone atual da conta. Informe um número diferente.',
                );
            }

            const existingPhone =
                await this.userService.findByPhoneNumber(phoneNumber);
            if (existingPhone && existingPhone.id !== user.id) {
                throw new BadRequestException(
                    'Este telefone já está cadastrado em outra conta.',
                );
            }

            const phoneCode = this.cryptoService.generateCode();
            const next: RecoverySession = {
                ...data,
                phoneNumber,
            };
            await this.redis.setex(
                this.recoveryKey(recoveryId, 'data'),
                RECOVERY_SESSION_TTL_SECONDS,
                JSON.stringify(next),
            );
            await this.redis.setex(
                this.recoveryKey(recoveryId, 'phone'),
                OTP_TTL_SECONDS,
                phoneCode,
            );

            this.logger.log(
                `Recovery phone code for ${phoneNumber}: ${phoneCode}`,
            );

            return {
                message: 'Código enviado ao novo telefone',
                recovery_id: recoveryId,
                expires_in: OTP_TTL_SECONDS,
                resend_after: OTP_RESEND_AFTER_SECONDS,
            };
        } catch (e) {
            Utils.logError(
                this.logger,
                'Failed to request recovery phone code',
                e,
            );
            Utils.handleError(e);
        }
    }

    async recoveryVerifyPhoneCode(
        recoveryVerifyPhoneCodeDTO: RecoveryVerifyPhoneCodeDTO,
    ) {
        try {
            const recoveryId = recoveryVerifyPhoneCodeDTO.recovery_id;
            const phoneNumber = recoveryVerifyPhoneCodeDTO.phone_number;
            const [dataValue, storedCode] = await Promise.all([
                this.redis.get(this.recoveryKey(recoveryId, 'data')),
                this.redis.get(this.recoveryKey(recoveryId, 'phone')),
            ]);
            const data = this.parseJson<RecoverySession>(dataValue);

            if (
                !data ||
                !data.emailVerified ||
                data.phoneNumber !== phoneNumber ||
                !storedCode ||
                storedCode !== recoveryVerifyPhoneCodeDTO.phone_code
            ) {
                throw new UnauthorizedException('Código inválido ou expirado');
            }

            const user = await this.userService.findById(data.userId);
            if (!user) {
                throw new UnauthorizedException('Código inválido ou expirado');
            }

            await this.userService.changePhoneNumber(user.id, phoneNumber);
            await this.userService.markEmailConfirmed(user.id);
            await this.redis.del(
                this.recoveryKey(recoveryId, 'data'),
                this.recoveryKey(recoveryId, 'email'),
                this.recoveryKey(recoveryId, 'phone'),
            );

            return { message: 'Phone number updated successfully' };
        } catch (e) {
            Utils.logError(
                this.logger,
                'Failed to verify recovery phone code',
                e,
            );
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
