import { Module } from '@nestjs/common';
import { CryptoModule } from 'src/common/crypto/crypto.module';
import { RedisModule } from 'src/common/redis/redis.module';
import { UsersModule } from '../users/users.module';
import { GoogleCalendarController } from './google-calendar.controller';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarRepository } from './repositories/google-calendar.repository';

@Module({
    imports: [UsersModule, RedisModule, CryptoModule],
    controllers: [GoogleCalendarController],
    providers: [GoogleCalendarService, GoogleCalendarRepository],
    exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
