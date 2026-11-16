import {
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ACCESS_TOKEN_TTL_SECONDS, sessionKey } from './session-key';
import { JwtPayload } from './types/jwt-payload.interface';

function setup() {
    const userService = {
        findByPhoneNumber: jest.fn(),
        findByEmail: jest.fn(),
        findById: jest.fn(),
        changePhoneNumber: jest.fn(),
        createVerifiedClient: jest.fn(),
        markEmailConfirmed: jest.fn(),
        markPhoneConfirmed: jest.fn(),
    };
    const cryptoService = { generateCode: jest.fn(() => '123456') };
    const jwtService = {
        signAsync: jest.fn((payload: JwtPayload) => {
            void payload;
            return Promise.resolve('signed-token');
        }),
    };
    const configService = {
        get: jest.fn((key: string) =>
            key === 'SITE_ID' ? 'site-a' : undefined,
        ),
    };
    const redis = {
        setex: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
    };
    const service = new AuthService(
        userService as never,
        cryptoService as never,
        jwtService as never,
        configService as never,
        redis as never,
    );
    return { service, userService, cryptoService, jwtService, redis };
}

const signupData = {
    name: 'Ana Souza',
    phone_number: '11999999999',
    email: 'ana@example.com',
};

describe('AuthService', () => {
    it('solicita código de cadastro apenas para o e-mail', async () => {
        const { service, userService, cryptoService, redis } = setup();
        userService.findByPhoneNumber.mockResolvedValue(null);
        userService.findByEmail.mockResolvedValue(null);
        cryptoService.generateCode.mockReturnValueOnce('111111');

        const result = (await service.signupRequestCode(signupData)) as {
            signup_id: string;
            expires_in: number;
            resend_after: number;
        };
        const signupId = result.signup_id;

        expect(signupId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
        expect(result.expires_in).toBe(300);
        expect(result.resend_after).toBe(90);
        expect(redis.setex).toHaveBeenCalledWith(
            `site-a:signup:${signupId}:data`,
            600,
            JSON.stringify({ ...signupData, emailVerified: false }),
        );
        expect(redis.setex).toHaveBeenCalledWith(
            `site-a:signup:${signupId}:email`,
            300,
            '111111',
        );
        expect(redis.setex).not.toHaveBeenCalledWith(
            `site-a:signup:${signupId}:phone`,
            expect.anything(),
            expect.anything(),
        );
    });

    it('rejeita cadastro com telefone ou e-mail já usados', async () => {
        const { service, userService, redis } = setup();
        userService.findByPhoneNumber.mockResolvedValue({ id: 1 });
        await expect(
            service.signupRequestCode(signupData),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(redis.setex).not.toHaveBeenCalled();

        userService.findByPhoneNumber.mockResolvedValue(null);
        userService.findByEmail.mockResolvedValue({ id: 2 });
        await expect(
            service.signupRequestCode(signupData),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(redis.setex).not.toHaveBeenCalled();
    });

    it('reenvia o código de e-mail do cadastro', async () => {
        const { service, cryptoService, redis } = setup();
        redis.get.mockResolvedValue(
            JSON.stringify({ ...signupData, emailVerified: false }),
        );
        cryptoService.generateCode.mockReturnValueOnce('333333');

        await expect(
            service.signupResendCode({ signup_id: 'signup-1' }),
        ).resolves.toMatchObject({
            signup_id: 'signup-1',
            expires_in: 300,
            resend_after: 90,
        });
        expect(redis.setex).toHaveBeenCalledWith(
            'site-a:signup:signup-1:email',
            300,
            '333333',
        );
    });

    it('confirma e-mail e gera automaticamente o código do telefone', async () => {
        const { service, cryptoService, redis } = setup();
        redis.get
            .mockResolvedValueOnce(
                JSON.stringify({ ...signupData, emailVerified: false }),
            )
            .mockResolvedValueOnce('111111');
        cryptoService.generateCode.mockReturnValueOnce('222222');

        await expect(
            service.signupVerifyEmailCode({
                signup_id: 'signup-1',
                email_code: '111111',
            }),
        ).resolves.toMatchObject({
            signup_id: 'signup-1',
            expires_in: 300,
            resend_after: 90,
        });
        expect(redis.setex).toHaveBeenCalledWith(
            'site-a:signup:signup-1:data',
            600,
            JSON.stringify({ ...signupData, emailVerified: true }),
        );
        expect(redis.setex).toHaveBeenCalledWith(
            'site-a:signup:signup-1:phone',
            300,
            '222222',
        );
    });

    it('reenvia o código do telefone após confirmar o e-mail', async () => {
        const { service, cryptoService, redis } = setup();
        redis.get.mockResolvedValue(
            JSON.stringify({ ...signupData, emailVerified: true }),
        );
        cryptoService.generateCode.mockReturnValueOnce('444444');

        await expect(
            service.signupResendPhoneCode({ signup_id: 'signup-1' }),
        ).resolves.toMatchObject({
            signup_id: 'signup-1',
            expires_in: 300,
            resend_after: 90,
        });
        expect(redis.setex).toHaveBeenCalledWith(
            'site-a:signup:signup-1:phone',
            300,
            '444444',
        );
    });

    it('cria cliente somente após validar o código do telefone', async () => {
        const { service, userService, redis } = setup();
        redis.get
            .mockResolvedValueOnce(
                JSON.stringify({ ...signupData, emailVerified: true }),
            )
            .mockResolvedValueOnce('222222');
        userService.createVerifiedClient.mockResolvedValue({ id: 7 });

        await expect(
            service.signupVerifyPhoneCode({
                signup_id: 'signup-1',
                phone_code: '222222',
            }),
        ).resolves.toEqual({ message: 'Cadastro confirmado com sucesso' });
        expect(userService.createVerifiedClient).toHaveBeenCalledWith(
            signupData,
        );
        expect(redis.del).toHaveBeenCalledWith(
            'site-a:signup:signup-1:data',
            'site-a:signup:signup-1:email',
            'site-a:signup:signup-1:phone',
        );
    });

    it('não cria cliente com código de cadastro inválido', async () => {
        const { service, userService, redis } = setup();
        redis.get
            .mockResolvedValueOnce(
                JSON.stringify({ ...signupData, emailVerified: true }),
            )
            .mockResolvedValueOnce('222222');

        await expect(
            service.signupVerifyPhoneCode({
                signup_id: 'signup-1',
                phone_code: '000000',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
        expect(userService.createVerifiedClient).not.toHaveBeenCalled();
    });

    it('envia código de login para telefone cadastrado', async () => {
        const { service, userService, cryptoService, redis } = setup();
        userService.findByPhoneNumber.mockResolvedValue({ id: 1 });

        await expect(
            service.requestCode({ phone_number: '11999999999' }),
        ).resolves.toEqual({
            message: 'If the phone number is registered, a code was sent',
            expires_in: 300,
            resend_after: 90,
        });
        expect(cryptoService.generateCode).toHaveBeenCalled();
        expect(redis.setex).toHaveBeenCalledWith(
            'site-a:auth_code:11999999999',
            300,
            '123456',
        );

        userService.findByPhoneNumber.mockResolvedValue(null);
        const rejection = service.requestCode({
            phone_number: '11888888888',
        });
        await expect(rejection).rejects.toBeInstanceOf(NotFoundException);
        await expect(rejection).rejects.toThrow('Telefone não cadastrado');
        expect(redis.setex).toHaveBeenCalledTimes(1);
    });

    it('valida código de login, confirma o telefone e cria sessão', async () => {
        const { service, userService, redis, jwtService } = setup();
        userService.findByPhoneNumber.mockResolvedValue({ id: 7 });
        redis.get.mockResolvedValue('123456');

        await expect(
            service.verifyCode({
                phone_number: '11999999999',
                verification_code: '123456',
            }),
        ).resolves.toEqual({ access_token: 'signed-token' });
        expect(userService.markPhoneConfirmed).toHaveBeenCalledWith(7);
        expect(redis.del).toHaveBeenCalledWith('site-a:auth_code:11999999999');
        expect(redis.setex).toHaveBeenCalledWith(
            expect.stringMatching(/^site-a:session:/),
            ACCESS_TOKEN_TTL_SECONDS,
            '7',
        );
        const payload = jwtService.signAsync.mock.calls[0][0] as {
            keyType: string;
            id: number;
            jti: string;
        };
        expect(payload).toMatchObject({ keyType: 'access', id: 7 });
        expect(payload.jti).toBeTruthy();
    });

    it('rejeita código de login inválido ou usuário inexistente', async () => {
        const { service, userService, redis } = setup();
        userService.findByPhoneNumber.mockResolvedValue(null);
        await expect(
            service.verifyCode({
                phone_number: '11999999999',
                verification_code: '123456',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedException);

        userService.findByPhoneNumber.mockResolvedValue({ id: 7 });
        redis.get.mockResolvedValue('999999');
        await expect(
            service.verifyCode({
                phone_number: '11999999999',
                verification_code: '123456',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
        expect(userService.markPhoneConfirmed).not.toHaveBeenCalled();
    });

    it('recupera a conta em etapas: e-mail, código, telefone e código', async () => {
        const { service, userService, cryptoService, redis } = setup();
        userService.findByEmail.mockResolvedValue({ id: 7 });
        userService.findById.mockResolvedValue({
            id: 7,
            phone_number: '11999999999',
        });
        userService.findByPhoneNumber.mockResolvedValue(null);
        cryptoService.generateCode
            .mockReturnValueOnce('111111')
            .mockReturnValueOnce('222222');

        const requested = (await service.recoveryRequestEmailCode({
            email: 'a@b.com',
        })) as { recovery_id: string };

        expect(requested.recovery_id).toBeTruthy();
        expect(redis.setex).toHaveBeenCalledWith(
            `site-a:recovery:${requested.recovery_id}:data`,
            600,
            JSON.stringify({
                email: 'a@b.com',
                userId: 7,
                emailVerified: false,
            }),
        );
        expect(redis.setex).toHaveBeenCalledWith(
            `site-a:recovery:${requested.recovery_id}:email`,
            300,
            '111111',
        );

        redis.get
            .mockResolvedValueOnce(
                JSON.stringify({
                    email: 'a@b.com',
                    userId: 7,
                    emailVerified: false,
                }),
            )
            .mockResolvedValueOnce('111111');
        await expect(
            service.recoveryVerifyEmailCode({
                recovery_id: requested.recovery_id,
                email_code: '111111',
            }),
        ).resolves.toEqual({
            message: 'E-mail confirmado',
            recovery_id: requested.recovery_id,
        });
        expect(redis.del).toHaveBeenCalledWith(
            `site-a:recovery:${requested.recovery_id}:email`,
        );

        redis.get.mockResolvedValue(
            JSON.stringify({
                email: 'a@b.com',
                userId: 7,
                emailVerified: true,
            }),
        );
        await expect(
            service.recoveryRequestPhoneCode({
                recovery_id: requested.recovery_id,
                phone_number: '11988888888',
            }),
        ).resolves.toMatchObject({
            expires_in: 300,
            resend_after: 90,
        });
        expect(redis.setex).toHaveBeenCalledWith(
            `site-a:recovery:${requested.recovery_id}:phone`,
            300,
            '222222',
        );

        redis.get
            .mockResolvedValueOnce(
                JSON.stringify({
                    email: 'a@b.com',
                    userId: 7,
                    emailVerified: true,
                    phoneNumber: '11988888888',
                }),
            )
            .mockResolvedValueOnce('222222');
        await expect(
            service.recoveryVerifyPhoneCode({
                recovery_id: requested.recovery_id,
                phone_number: '11988888888',
                phone_code: '222222',
            }),
        ).resolves.toEqual({ message: 'Phone number updated successfully' });
        expect(userService.changePhoneNumber).toHaveBeenCalledWith(
            7,
            '11988888888',
        );
        expect(userService.markEmailConfirmed).toHaveBeenCalledWith(7);
    });

    it('rejeita recuperação para e-mail inexistente', async () => {
        const { service, userService, redis } = setup();
        userService.findByEmail.mockResolvedValue(null);

        const rejection = service.recoveryRequestEmailCode({
            email: 'nao-existe@example.com',
        });
        await expect(rejection).rejects.toBeInstanceOf(NotFoundException);
        await expect(rejection).rejects.toThrow(
            'Não encontramos uma conta com este e-mail',
        );
        expect(redis.setex).not.toHaveBeenCalled();
    });

    it('rejeita telefone atual ou de outra conta na recuperação', async () => {
        const { service, userService, redis } = setup();
        const data = JSON.stringify({
            email: 'a@b.com',
            userId: 7,
            emailVerified: true,
        });
        redis.get.mockResolvedValue(data);
        userService.findById.mockResolvedValue({
            id: 7,
            phone_number: '11999999999',
        });

        await expect(
            service.recoveryRequestPhoneCode({
                recovery_id: 'recovery-1',
                phone_number: '11999999999',
            }),
        ).rejects.toThrow(
            'Este é o telefone atual da conta. Informe um número diferente.',
        );

        userService.findByPhoneNumber.mockResolvedValue({ id: 8 });
        await expect(
            service.recoveryRequestPhoneCode({
                recovery_id: 'recovery-1',
                phone_number: '11988888888',
            }),
        ).rejects.toThrow('Este telefone já está cadastrado em outra conta.');
    });

    it('rejeita códigos de recuperação inválidos', async () => {
        const { service, userService, redis } = setup();
        redis.get
            .mockResolvedValueOnce(
                JSON.stringify({
                    email: 'a@b.com',
                    userId: 7,
                    emailVerified: false,
                }),
            )
            .mockResolvedValueOnce('111111');
        await expect(
            service.recoveryVerifyEmailCode({
                recovery_id: 'recovery-1',
                email_code: '000000',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedException);

        redis.get.mockResolvedValue(
            JSON.stringify({
                email: 'a@b.com',
                userId: 7,
                emailVerified: true,
                phoneNumber: '11988888888',
            }),
        );
        userService.findById.mockResolvedValue({
            id: 7,
            phone_number: '11999999999',
        });
        await expect(
            service.recoveryVerifyPhoneCode({
                recovery_id: 'recovery-1',
                phone_number: '11988888888',
                phone_code: '000000',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('encerra a sessão pelo jti', async () => {
        const { service, redis } = setup();
        await expect(service.logout('jti-1')).resolves.toEqual({
            message: 'Logged out',
        });
        expect(redis.del).toHaveBeenCalledWith(sessionKey('site-a', 'jti-1'));
    });
});
