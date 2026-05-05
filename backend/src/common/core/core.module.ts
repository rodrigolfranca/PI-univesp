import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';
import { DatabaseModule } from '../database/database.module';
import { validate } from '../env.validation/env.validation';
import { PopsModule } from 'src/modules/pops/pops.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
            validate,
        }),
        DatabaseModule,
        UsersModule,
        PopsModule,
        AuthModule
    ],
})
export class CoreModule { }
