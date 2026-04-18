import { ConfigService } from "@nestjs/config";
import { Sequelize } from "sequelize-typescript";
import { User } from "src/common/models/users.model";

export const DatabaseProvider = {
    provide: 'DATABASE_PROVIDER',
    useFactory: async () => {
        const configService = new ConfigService();
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

        sequelize.addModels([User]);
        sequelize.sync()

        return sequelize;
    }
}