import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../../common/redis/redis.module';
import { ProceduresController } from './procedures.controller';
import { ProceduresService } from './procedures.service';
import { ProceduresRepository } from './repositories/procedures.repository';

@Module({
    imports: [AuthModule, UsersModule, RedisModule],
    controllers: [ProceduresController],
    providers: [ProceduresService, ProceduresRepository],
})
export class ProceduresModule {}
