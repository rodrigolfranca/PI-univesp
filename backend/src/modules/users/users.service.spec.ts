import {
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';

function setup() {
    const transaction = { commit: jest.fn(), rollback: jest.fn() };
    const usersRepository = {
        startTransaction: jest.fn(() => Promise.resolve(transaction)),
        findByPhoneNumber: jest.fn(),
        findByEmail: jest.fn(),
        isUserPhoneNumber: jest.fn(),
        isUserEmail: jest.fn(),
        create: jest.fn(),
        getById: jest.fn(),
        update: jest.fn(),
        updateContact: jest.fn(),
        delete: jest.fn(),
        countUpcomingSchedules: jest.fn().mockResolvedValue(0),
        list: jest.fn(),
    };
    const clientsRepository = { create: jest.fn() };
    const professionalsRepository = {
        create: jest.fn(),
        getById: jest.fn(),
        findAll: jest.fn(),
    };
    const configService = {
        get: jest.fn((key: string) =>
            key === 'SITE_ID' ? 'site-a' : undefined,
        ),
    };
    const redis = { del: jest.fn(), setex: jest.fn(), get: jest.fn() };
    const service = new UsersService(
        usersRepository as never,
        clientsRepository as never,
        professionalsRepository as never,
        configService as never,
        redis as never,
    );
    return {
        service,
        transaction,
        usersRepository,
        clientsRepository,
        professionalsRepository,
        redis,
    };
}

const userDto = {
    name: 'Maria Silva',
    phone_number: '11999999999',
    phone_number_confirmed: true,
    email: 'maria@example.com',
    is_admin: false,
};

describe('UsersService', () => {
    it('cria cliente em transação', async () => {
        const { service, transaction, usersRepository, clientsRepository } =
            setup();
        usersRepository.findByPhoneNumber.mockResolvedValue(null);
        usersRepository.findByEmail.mockResolvedValue(null);
        usersRepository.create.mockResolvedValue({ id: 1 });
        clientsRepository.create.mockResolvedValue({ id: 2 });

        await expect(service.createClient(userDto as never)).resolves.toEqual({
            id: 2,
        });
        expect(transaction.commit).toHaveBeenCalled();
        expect(transaction.rollback).not.toHaveBeenCalled();
    });

    it('cria cliente verificado com contatos confirmados', async () => {
        const { service, transaction, usersRepository, clientsRepository } =
            setup();
        usersRepository.findByPhoneNumber.mockResolvedValue(null);
        usersRepository.findByEmail.mockResolvedValue(null);
        usersRepository.create.mockResolvedValue({ id: 1 });
        clientsRepository.create.mockResolvedValue({ id: 2 });

        await expect(
            service.createVerifiedClient({
                name: 'Ana Souza',
                phone_number: '11999999999',
                email: 'ana@example.com',
            }),
        ).resolves.toEqual({ id: 2 });
        expect(usersRepository.create).toHaveBeenCalledWith(
            {
                name: 'Ana Souza',
                phone_number: '11999999999',
                email: 'ana@example.com',
                phone_number_confirmed: true,
                email_confirmed: true,
                is_admin: false,
            },
            transaction,
        );
        expect(transaction.commit).toHaveBeenCalled();
    });

    it('rejeita cliente duplicado e desfaz transação', async () => {
        const { service, transaction, usersRepository } = setup();
        usersRepository.findByPhoneNumber.mockResolvedValue({ id: 1 });
        await expect(
            service.createClient(userDto as never),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(transaction.rollback).toHaveBeenCalled();

        usersRepository.findByPhoneNumber.mockResolvedValue(null);
        usersRepository.findByEmail.mockResolvedValue({ id: 2 });
        await expect(
            service.createClient(userDto as never),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('protege alteração de contato em updateUser', async () => {
        const { service, usersRepository, redis } = setup();
        usersRepository.getById.mockResolvedValue({
            id: 1,
            phone_number: '11999999999',
            email: 'a@b.com',
        });
        await expect(
            service.updateUser(1, { phone_number: '11988888888' } as never),
        ).rejects.toBeInstanceOf(BadRequestException);
        await expect(
            service.updateUser(1, { email: 'novo@b.com' } as never),
        ).rejects.toBeInstanceOf(BadRequestException);

        usersRepository.getById.mockResolvedValue(null);
        await expect(
            service.updateUser(1, { name: 'Novo' }),
        ).rejects.toBeInstanceOf(NotFoundException);

        usersRepository.getById.mockResolvedValue({
            id: 1,
            phone_number: '11999999999',
            email: 'a@b.com',
        });
        usersRepository.findByPhoneNumber.mockResolvedValue(null);
        usersRepository.update.mockResolvedValue({ id: 1 });
        await expect(
            service.updateUser(1, {
                phone_number: '11999999999',
                name: 'Novo',
            } as never),
        ).resolves.toEqual({ id: 1 });
        expect(redis.del).toHaveBeenCalledWith('site-a:user:1');
    });

    it('remove usuário e invalida cache', async () => {
        const { service, usersRepository, redis } = setup();
        usersRepository.delete.mockResolvedValue(true);
        await service.deleteUser(1);
        expect(usersRepository.countUpcomingSchedules).toHaveBeenCalledWith(
            1,
            expect.any(String),
        );
        expect(usersRepository.delete).toHaveBeenCalledWith(1);
        expect(redis.del).toHaveBeenCalledWith('site-a:user:1');
    });

    it('impede admin de excluir a própria conta', async () => {
        const { service, usersRepository } = setup();
        await expect(
            service.deleteUser(1, {
                id: 1,
                professional: { id: 8, is_admin: true },
            } as never),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(usersRepository.delete).not.toHaveBeenCalled();
    });

    it('impede exclusão de conta com agendamentos futuros', async () => {
        const { service, usersRepository, redis } = setup();
        usersRepository.countUpcomingSchedules.mockResolvedValue(1);
        await expect(
            service.deleteUser(42, {
                id: 51,
                professional: { id: 8, is_admin: true },
            } as never),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(usersRepository.delete).not.toHaveBeenCalled();
        expect(redis.del).not.toHaveBeenCalled();
    });

    it('solicita troca de contato com código e valida duplicidade', async () => {
        const { service, usersRepository, redis } = setup();
        usersRepository.getById.mockResolvedValue({ id: 1 });
        usersRepository.findByPhoneNumber.mockResolvedValue(null);
        await expect(
            service.requestContactChange(1, {
                field: 'phone',
                value: '11988888888',
            } as never),
        ).resolves.toMatchObject({ expires_in: 300, resend_after: 90 });
        expect(redis.setex).toHaveBeenCalledWith(
            'site-a:contact_change:1:phone',
            300,
            expect.stringContaining('"value":"11988888888"'),
        );

        usersRepository.findByPhoneNumber.mockResolvedValue({ id: 2 });
        await expect(
            service.requestContactChange(1, {
                field: 'phone',
                value: '11977777777',
            } as never),
        ).rejects.toBeInstanceOf(BadRequestException);

        usersRepository.getById.mockResolvedValue(null);
        await expect(
            service.requestContactChange(9, {
                field: 'email',
                value: 'x@y.com',
            } as never),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejeita contato igual ao atual', async () => {
        const { service, usersRepository } = setup();
        usersRepository.getById.mockResolvedValue({
            id: 1,
            phone_number: '11999999999',
            email: 'a@b.com',
        });

        await expect(
            service.requestContactChange(1, {
                field: 'phone',
                value: '11999999999',
            } as never),
        ).rejects.toThrow(
            'Este é o telefone atual da conta. Informe um número diferente.',
        );

        await expect(
            service.requestContactChange(1, {
                field: 'email',
                value: 'a@b.com',
            } as never),
        ).rejects.toThrow(
            'Este é o e-mail atual da conta. Informe um e-mail diferente.',
        );
    });

    it('solicita confirmação do e-mail atual', async () => {
        const { service, usersRepository, redis } = setup();
        usersRepository.getById.mockResolvedValue({
            id: 1,
            email: 'a@b.com',
        });

        await expect(
            service.requestEmailConfirmation(1),
        ).resolves.toMatchObject({
            expires_in: 300,
            resend_after: 90,
        });
        expect(redis.setex).toHaveBeenCalledWith(
            'site-a:contact_change:1:email',
            300,
            expect.stringContaining('"value":"a@b.com"'),
        );
    });

    it('confirma troca de contato apenas com código correto', async () => {
        const { service, usersRepository, redis } = setup();
        redis.get.mockResolvedValue(
            JSON.stringify({ value: '11988888888', code: '123456' }),
        );
        usersRepository.findByPhoneNumber.mockResolvedValue(null);
        usersRepository.updateContact.mockResolvedValue(true);

        await expect(
            service.verifyContactChange(1, {
                field: 'phone',
                value: '11988888888',
                code: '123456',
            } as never),
        ).resolves.toEqual({ message: 'Contato atualizado com sucesso' });
        expect(redis.del).toHaveBeenCalledWith('site-a:contact_change:1:phone');
        expect(redis.del).toHaveBeenCalledWith('site-a:user:1');

        redis.get.mockResolvedValue(null);
        await expect(
            service.verifyContactChange(1, {
                field: 'phone',
                value: '11988888888',
                code: '123456',
            } as never),
        ).rejects.toBeInstanceOf(UnauthorizedException);

        redis.get.mockResolvedValue(
            JSON.stringify({ value: '11988888888', code: '111111' }),
        );
        await expect(
            service.verifyContactChange(1, {
                field: 'phone',
                value: '11988888888',
                code: '123456',
            } as never),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('altera e-mail e telefone com validação de duplicidade', async () => {
        const { service, usersRepository, redis } = setup();
        usersRepository.findByEmail.mockResolvedValue({ id: 2 });
        await expect(service.changeEmail(1, 'x@y.com')).rejects.toBeInstanceOf(
            BadRequestException,
        );

        usersRepository.findByEmail.mockResolvedValue(null);
        usersRepository.updateContact.mockResolvedValue(true);
        await service.changeEmail(1, 'x@y.com');
        expect(redis.del).toHaveBeenCalledWith('site-a:user:1');
        expect(usersRepository.updateContact).toHaveBeenCalledWith(1, {
            email: 'x@y.com',
            email_confirmed: true,
        });

        usersRepository.findByPhoneNumber.mockResolvedValue({ id: 2 });
        usersRepository.isUserPhoneNumber.mockResolvedValue(false);
        await expect(
            service.changePhoneNumber(1, '11977777777'),
        ).rejects.toBeInstanceOf(BadRequestException);

        usersRepository.findByPhoneNumber.mockResolvedValue(null);
        await service.changePhoneNumber(1, '11977777777');
        expect(usersRepository.updateContact).toHaveBeenCalledWith(1, {
            phone_number: '11977777777',
            phone_number_confirmed: true,
        });
    });

    it('marca telefone e e-mail como confirmados', async () => {
        const { service, usersRepository } = setup();
        usersRepository.updateContact.mockResolvedValue({ id: 1 });

        await service.markPhoneConfirmed(1);
        expect(usersRepository.updateContact).toHaveBeenCalledWith(1, {
            phone_number_confirmed: true,
        });

        await service.markEmailConfirmed(1);
        expect(usersRepository.updateContact).toHaveBeenCalledWith(1, {
            email_confirmed: true,
        });
    });

    it('lista usuários e profissionais', async () => {
        const { service, usersRepository, professionalsRepository } = setup();
        usersRepository.list.mockResolvedValue({ count: 1, rows: [{ id: 1 }] });
        await expect(
            service.listUsers({ page: 1, limit: 10 } as never),
        ).resolves.toEqual({
            total: 1,
            page: 1,
            limit: 10,
            users: [{ id: 1 }],
        });

        professionalsRepository.getById.mockResolvedValue({ id: 8 });
        professionalsRepository.findAll.mockResolvedValue([{ id: 8 }]);
        await expect(service.findProfessionalById(8)).resolves.toEqual({
            id: 8,
        });
        await expect(service.findAllProfessionals()).resolves.toEqual([
            { id: 8 },
        ]);
    });
});
