import { Module } from '@nestjs/common';
import { RedisModule } from 'src/common/redis/redis.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AdminGuard } from 'src/modules/auth/guards';
import { UsersModule } from 'src/modules/users/users.module';
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
