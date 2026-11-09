import 'pg';
import { ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize-typescript';
import {
    Category,
    Client,
    DocumentTemplates,
    GalleryImage,
    Pop,
    Procedure,
    Professional,
    Schedule,
    ScheduleException,
    Session,
    SiteBrand,
    User,
    WorkSchedule,
} from '../../models';

function parseBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();

        if (['true', '1', 'yes', 'on'].includes(normalized)) {
            return true;
        }

        if (['false', '0', 'no', 'off'].includes(normalized)) {
            return false;
        }
    }

    return undefined;
}

function isProduction(value: unknown): boolean {
    return ['production', 'prod'].includes(String(value).toLowerCase());
}

export const DatabaseProvider = {
    provide: 'DATABASE_PROVIDER',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST')!;
        const port = configService.get<number>('DB_PORT')!;
        const username = configService.get<string>('DB_USERNAME')!;
        const password = configService.get<string>('DB_PASSWORD')!;
        const database = configService.get<string>('DB_NAME')!;
        const nodeEnv = configService.get<string>('NODE_ENV');
        const production = isProduction(nodeEnv);
        const ssl = parseBoolean(configService.get('DB_SSL')) ?? production;
        const sslCaBase64 = configService.get<string>('DB_SSL_CA_BASE64');
        const sslCa = sslCaBase64
            ? Buffer.from(sslCaBase64, 'base64').toString('utf8')
            : undefined;
        const sync = parseBoolean(configService.get('DB_SYNC')) ?? !production;

        const sequelize = new Sequelize({
            dialect: 'postgres',
            host,
            port,
            username,
            password,
            database,
            logging: false,
            dialectOptions: ssl
                ? {
                      ssl: {
                          require: true,
                          rejectUnauthorized: true,
                          ...(sslCa ? { ca: sslCa } : {}),
                      },
                  }
                : undefined,
            pool: {
                max: 3,
                min: 0,
                acquire: 30000,
                idle: 10000,
            },
        });

        sequelize.addModels([
            User,
            Category,
            Client,
            Professional,
            Pop,
            Procedure,
            Session,
            DocumentTemplates,
            Schedule,
            WorkSchedule,
            ScheduleException,
            SiteBrand,
            GalleryImage,
        ]);

        if (sync) {
            await sequelize.sync();
        }

        return sequelize;
    },
};
