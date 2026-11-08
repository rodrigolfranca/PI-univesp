import { NestFactory } from '@nestjs/core';
import { Sequelize } from 'sequelize-typescript';
import { SeedAdminModule } from './seed-admin.module';

async function migrate(): Promise<void> {
    const app = await NestFactory.createApplicationContext(SeedAdminModule, {
        logger: ['error', 'warn'],
    });
    const sequelize = app.get<Sequelize>('DATABASE_PROVIDER');

    try {
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL UNIQUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ
            )
        `);
        await sequelize.query(
            "INSERT INTO categories (name, created_at, updated_at) SELECT 'Geral', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Geral')",
        );
        await sequelize.query(
            'ALTER TABLE procedures ADD COLUMN IF NOT EXISTS category_id INTEGER',
        );
        await sequelize.query(
            "UPDATE procedures SET category_id = (SELECT id FROM categories WHERE name = 'Geral' LIMIT 1) WHERE category_id IS NULL",
        );
        await sequelize.query(
            'ALTER TABLE procedures ALTER COLUMN category_id SET NOT NULL',
        );
        await sequelize.query(
            'CREATE INDEX IF NOT EXISTS idx_procedures_category_id ON procedures (category_id)',
        );
        console.log('Categorias e procedures.category_id garantidos.');
    } finally {
        await app.close();
        await sequelize.close();
    }
}

void migrate().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Falha na migração');
    process.exitCode = 1;
});
