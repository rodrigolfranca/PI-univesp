import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';
import { RedisModule } from 'src/common/redis/redis.module';
import { ProceduresController } from './procedures.controller';
import { ProceduresService } from './procedures.service';
import { ProceduresRepository } from './repositories/procedures.repository';

@Module({
    imports: [AuthModule, UsersModule, RedisModule],
    controllers: [ProceduresController],
    providers: [ProceduresService, ProceduresRepository],
})
export class ProceduresModule {}
