import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/modules/auth/auth.module';
import { ProceduresModule } from 'src/modules/procedures/procedures.module';
import { UsersModule } from 'src/modules/users/users.module';
import { DatabaseModule } from '../database/database.module';
import { validate } from '../env.validation/env.validation';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
            validate,
        }),
        DatabaseModule,
        UsersModule,
        ProceduresModule,
        AuthModule
    ],
})
export class CoreModule { }
