import { Module } from '@nestjs/common';
import { RedisModule } from '../../common/redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../auth/guards';
import { UsersModule } from '../users/users.module';
import { SiteController } from './controllers/site.controller';
import { SiteRepository } from './repositories/site.repository';
import { SiteService } from './services/site.service';
import { SiteStorageService } from './services/site-storage.service';

@Module({
    imports: [AuthModule, UsersModule, RedisModule],
    controllers: [SiteController],
    providers: [SiteService, SiteRepository, SiteStorageService, AdminGuard],
})
export class SiteModule {}
