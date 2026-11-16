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
            CREATE TABLE IF NOT EXISTS procedure_professionals (
                procedure_id INTEGER NOT NULL REFERENCES procedures(id) ON DELETE CASCADE ON UPDATE CASCADE,
                professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY (procedure_id, professional_id)
            )
        `);
        await sequelize.query(
            'CREATE INDEX IF NOT EXISTS idx_procedure_professionals_professional_id ON procedure_professionals (professional_id)',
        );
        await sequelize.query(`
            INSERT INTO procedure_professionals (procedure_id, professional_id)
            SELECT p.id, pr.id
            FROM procedures p
            CROSS JOIN professionals pr
            WHERE p.deleted_at IS NULL
              AND pr.deleted_at IS NULL
              AND NOT EXISTS (
                  SELECT 1
                  FROM procedure_professionals pp
                  WHERE pp.procedure_id = p.id
              )
            ON CONFLICT DO NOTHING
        `);
        console.log(
            'Tabela procedure_professionals e vínculos iniciais garantidos.',
        );
    } finally {
        await app.close();
        await sequelize.close();
    }
}

void migrate().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Falha na migração');
    process.exitCode = 1;
});
