import { Module } from '@nestjs/common';
import { CryptoModule } from '../../common/crypto/crypto.module';
import { RedisModule } from '../../common/redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GoogleCalendarController } from './google-calendar.controller';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarRepository } from './repositories/google-calendar.repository';

@Module({
    imports: [AuthModule, UsersModule, RedisModule, CryptoModule],
    controllers: [GoogleCalendarController],
    providers: [GoogleCalendarService, GoogleCalendarRepository],
    exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
