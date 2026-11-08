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
            "ALTER TABLE procedures ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'",
        );
        console.log('Coluna procedures.status garantida.');
    } finally {
        await app.close();
        await sequelize.close();
    }
}

void migrate().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Falha na migração');
    process.exitCode = 1;
});
