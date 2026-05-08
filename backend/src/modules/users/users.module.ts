import { forwardRef, Module } from '@nestjs/common';
import { RedisModule } from 'src/common/redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { ClientsRepository } from './repositories/clients.repository';
import { ProfessionalsRepository } from './repositories/professionals.repository';
import { UsersRepository } from './repositories/users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    imports: [RedisModule, forwardRef(() => AuthModule)],
    controllers: [UsersController],
    providers: [
        UsersService,
        UsersRepository,
        ClientsRepository,
        ProfessionalsRepository,
    ],
    exports: [UsersService],
})
export class UsersModule { }
