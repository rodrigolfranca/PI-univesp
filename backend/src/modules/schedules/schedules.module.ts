import { Module } from '@nestjs/common';
import { RedisModule } from 'src/common/redis/redis.module';
import { UsersModule } from '../users/users.module';
import { ScheduleExceptionsController } from './controllers/schedule-exceptions.controller';
import { ScheduleController } from './controllers/schedule.controller';
import { WorkScheduleController } from './controllers/work-schedule.controller';
import { ScheduleExceptionsRepository } from './repositories/schedule-exceptions.repository';
import { ScheduleRepository } from './repositories/schedules.repository';
import { WorkScheduleRepository } from './repositories/work-schedules.repository';
import { ScheduleExceptionsService } from './services/schedule-exceptions.service';
import { SchedulesService } from './services/schedules.service';
import { WorkSchedulesService } from './services/work-schedules.service';

@Module({
    imports: [UsersModule, RedisModule],
    controllers: [
        WorkScheduleController,
        ScheduleController,
        ScheduleExceptionsController,
    ],
    providers: [
        SchedulesService,
        WorkSchedulesService,
        ScheduleExceptionsService,
        WorkScheduleRepository,
        ScheduleRepository,
        ScheduleExceptionsRepository,
    ],
    exports: [],
})
export class SchedulesModule {}
