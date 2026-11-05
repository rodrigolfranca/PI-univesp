import { NestFactory } from '@nestjs/core';
import { Sequelize } from 'sequelize-typescript';
import { Professional, User } from '../common/models';
import { SeedAdminModule } from './seed-admin.module';

function requiredEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Variável de ambiente obrigatória: ${name}`);
    }
    return value;
}

async function seedAdmin(): Promise<void> {
    const app = await NestFactory.createApplicationContext(SeedAdminModule, {
        logger: ['error', 'warn'],
    });
    const sequelize = app.get<Sequelize>('DATABASE_PROVIDER');

    try {
        const name = requiredEnv('SEED_ADMIN_NAME');
        const phone = requiredEnv('SEED_ADMIN_PHONE');
        const email = requiredEnv('SEED_ADMIN_EMAIL');

        if (name.length < 3) {
            throw new Error('SEED_ADMIN_NAME deve ter pelo menos 3 caracteres');
        }
        if (!/^\d{11}$/.test(phone)) {
            throw new Error('SEED_ADMIN_PHONE deve ter exatamente 11 dígitos');
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            throw new Error('SEED_ADMIN_EMAIL inválido');
        }

        await sequelize.transaction(async (transaction) => {
            const byEmail = await User.findOne({
                where: { email },
                transaction,
            });
            const byPhone = await User.findOne({
                where: { phone_number: phone },
                transaction,
            });

            if (byEmail && byPhone && byEmail.id !== byPhone.id) {
                throw new Error(
                    'SEED_ADMIN_EMAIL e SEED_ADMIN_PHONE pertencem a usuários diferentes',
                );
            }

            const user =
                byEmail ??
                byPhone ??
                (await User.create(
                    {
                        name,
                        phone_number: phone,
                        phone_number_confirmed: true,
                        email,
                    },
                    { transaction },
                ));

            const existingProfessional = await Professional.findOne({
                where: { user_id: user.id },
                transaction,
            });

            if (existingProfessional) {
                if (!existingProfessional.is_admin) {
                    await existingProfessional.update(
                        { is_admin: true },
                        { transaction },
                    );
                }
            } else {
                await Professional.create(
                    {
                        user_id: user.id,
                        is_admin: true,
                    },
                    { transaction },
                );
            }

            console.log(
                `Admin garantido para o usuário ${user.email} (id ${user.id}).`,
            );
        });
    } finally {
        await app.close();
        await sequelize.close();
    }
}

void seedAdmin().catch((error: unknown) => {
    console.error(
        error instanceof Error ? error.message : 'Falha ao executar o seed',
    );
    process.exitCode = 1;
});
