import { Module } from '@nestjs/common';
import { RedisModule } from '../../common/redis/redis.module';
import { AdminGuard } from '../auth/guards';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PopsController } from './pops.controller';
import { PopsService } from './pops.service';
import { PopsRepository } from './repositories/pops.repository';

@Module({
    imports: [UsersModule, AuthModule, RedisModule],
    controllers: [PopsController],
    providers: [PopsService, PopsRepository, AdminGuard],
})
export class PopsModule {}
