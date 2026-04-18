import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/modules/users/users.module';
import { validate } from '../env.validation/env.validation';
import { HashModule } from '../hash/hash.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
            validate,
        }),
        HashModule,
        UsersModule],
})
export class CoreModule { }
''