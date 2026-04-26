import { ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize-typescript';
import {
    Client,
    DocumentTemplates,
    Pop,
    Procedure,
    Professional,
    Schedule,
    Session,
    User,
} from 'src/common/models';

export const DatabaseProvider = {
    provide: 'DATABASE_PROVIDER',
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST')!;
        const port = configService.get<number>('DB_PORT')!;
        const username = configService.get<string>('DB_USERNAME')!;
        const password = configService.get<string>('DB_PASSWORD')!;
        const database = configService.get<string>('DB_NAME')!;

        const sequelize = new Sequelize({
            dialect: 'postgres',
            host,
            port,
            username,
            password,
            database,
        });

        sequelize.addModels([
            User,
            Client,
            Professional,
            Pop,
            Procedure,
            Session,
            DocumentTemplates,
            Schedule,
        ]);

        await sequelize.sync(
            {
                alter: true,
            }
        );
        return sequelize;
    },
};
