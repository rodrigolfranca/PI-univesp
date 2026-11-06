import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../common/database/database.module';
import { validate } from '../common/env.validation/env.validation';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
            validate,
        }),
        DatabaseModule,
    ],
})
export class SeedAdminModule {}
