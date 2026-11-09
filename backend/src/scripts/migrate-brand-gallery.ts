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
            CREATE TABLE IF NOT EXISTS site_brand (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                logo_url TEXT,
                theme_preset VARCHAR(100) NOT NULL,
                theme_palette JSONB NOT NULL DEFAULT '{}'::jsonb,
                about_title VARCHAR(200) NOT NULL,
                about_paragraphs JSONB NOT NULL DEFAULT '[]'::jsonb,
                whatsapp_number VARCHAR(500) NOT NULL DEFAULT '',
                instagram_handle VARCHAR(100) NOT NULL DEFAULT '',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS gallery_images (
                id SERIAL PRIMARY KEY,
                url TEXT NOT NULL,
                storage_path TEXT,
                title VARCHAR(255),
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ
            )
        `);
        await sequelize.query(
            'CREATE INDEX IF NOT EXISTS idx_gallery_images_sort_order ON gallery_images (sort_order)',
        );
        console.log('Tabelas site_brand e gallery_images garantidas.');
    } finally {
        await app.close();
        await sequelize.close();
    }
}

void migrate().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Falha na migração');
    process.exitCode = 1;
});
