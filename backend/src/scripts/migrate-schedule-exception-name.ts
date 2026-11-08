import { NestFactory } from '@nestjs/core';
import { Sequelize } from 'sequelize-typescript';
import { SeedAdminModule } from './seed-admin.module';

async function migrate(): Promise<void> {
    const app = await NestFactory.createApplicationContext(SeedAdminModule, {
        logger: ['error', 'warn'],
    });
    const sequelize = app.get<Sequelize>('DATABASE_PROVIDER');

    try {
        await sequelize.query(
            'ALTER TABLE schedule_exceptions ADD COLUMN IF NOT EXISTS name VARCHAR(255)',
        );
        console.log('Coluna schedule_exceptions.name garantida.');
    } finally {
        await app.close();
        await sequelize.close();
    }
}

void migrate().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Falha na migração');
    process.exitCode = 1;
});
