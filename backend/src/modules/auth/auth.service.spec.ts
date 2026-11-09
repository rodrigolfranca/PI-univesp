import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ACCESS_TOKEN_TTL_SECONDS, sessionKey } from './session-key';

function setup() {
    const userService = {
        findByPhoneNumber: jest.fn(),
        findByEmail: jest.fn(),
        changePhoneNumber: jest.fn(),
    };
    const cryptoService = { generateCode: jest.fn(() => '123456') };
    const jwtService = {
        signAsync: jest.fn(() => Promise.resolve('signed-token')),
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

describe('AuthService', () => {
    it('envia código de login sem revelar existência da conta', async () => {
        const { service, userService, cryptoService, redis } = setup();
        userService.findByPhoneNumber.mockResolvedValue({ id: 1 });

        await expect(
            service.requestCode({ phone_number: '11999999999' }),
        ).resolves.toEqual({
            message: 'If the phone number is registered, a code was sent',
        });
        expect(cryptoService.generateCode).toHaveBeenCalled();
        expect(redis.setex).toHaveBeenCalledWith(
            'site-a:auth_code:11999999999',
            300,
            '123456',
        );

        userService.findByPhoneNumber.mockResolvedValue(null);
        await expect(
            service.requestCode({ phone_number: '11888888888' }),
        ).resolves.toEqual({
            message: 'If the phone number is registered, a code was sent',
        });
        expect(redis.setex).toHaveBeenCalledTimes(1);
    });

    it('valida código de login e cria sessão', async () => {
        const { service, userService, redis, jwtService } = setup();
        userService.findByPhoneNumber.mockResolvedValue({ id: 7 });
        redis.get.mockResolvedValue('123456');

        await expect(
            service.verifyCode({
                phone_number: '11999999999',
                verification_code: '123456',
            }),
        ).resolves.toEqual({ access_token: 'signed-token' });
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
    });

    it('envia e valida código de recuperação', async () => {
        const { service, userService, redis } = setup();
        userService.findByEmail.mockResolvedValue({ id: 7 });

        await service.recoveryRequestCode({ email: 'a@b.com' });
        expect(redis.setex).toHaveBeenCalledWith(
            'site-a:recovery_code:a@b.com',
            300,
            '123456',
        );

        redis.get.mockResolvedValue('123456');
        await expect(
            service.recoveryVerifyCode({
                email: 'a@b.com',
                phone_number: '11988888888',
                verification_code: '123456',
            }),
        ).resolves.toEqual({ message: 'Phone number updated successfully' });
        expect(redis.del).toHaveBeenCalledWith('site-a:recovery_code:a@b.com');
        expect(userService.changePhoneNumber).toHaveBeenCalledWith(
            7,
            '11988888888',
        );
    });

    it('rejeita recuperação inválida', async () => {
        const { service, userService, redis } = setup();
        userService.findByEmail.mockResolvedValue(null);
        await expect(
            service.recoveryVerifyCode({
                email: 'a@b.com',
                phone_number: '11988888888',
                verification_code: '123456',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedException);

        userService.findByEmail.mockResolvedValue({ id: 7 });
        redis.get.mockResolvedValue('999999');
        await expect(
            service.recoveryVerifyCode({
                email: 'a@b.com',
                phone_number: '11988888888',
                verification_code: '123456',
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
