import { Module } from '@nestjs/common';
import { PopsController } from './pops.controller';
import { PopsService } from './pops.service';
import { PopsRepository } from './repositories/pops.repository';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
    imports: [UsersModule, AuthModule, RedisModule],
    controllers: [PopsController],
    providers: [PopsService, PopsRepository],
})
export class PopsModule {}
