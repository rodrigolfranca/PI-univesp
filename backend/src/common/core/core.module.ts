import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/modules/auth/auth.module';
import { GoogleCalendarModule } from 'src/modules/google-calendar/google-calendar.module';
import { PopsModule } from 'src/modules/pops/pops.module';
import { ProceduresModule } from 'src/modules/procedures/procedures.module';
import { SchedulesModule } from 'src/modules/schedules/schedules.module';
import { UsersModule } from 'src/modules/users/users.module';
import { DatabaseModule } from '../database/database.module';
import { validate } from '../env.validation/env.validation';
import { HealthModule } from '../health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
            validate,
        }),
        DatabaseModule,
        HealthModule,
        UsersModule,
        ProceduresModule,
        PopsModule,
        AuthModule,
        SchedulesModule,
        GoogleCalendarModule,
    ],
})
export class CoreModule {}
