import { Module } from '@nestjs/common';
import { RedisModule } from '../../common/redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './repositories/categories.repository';

@Module({
    imports: [AuthModule, UsersModule, RedisModule],
    controllers: [CategoriesController],
    providers: [CategoriesService, CategoriesRepository],
})
export class CategoriesModule {}
