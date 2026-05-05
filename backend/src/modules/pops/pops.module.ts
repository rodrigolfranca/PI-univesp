import { Module } from '@nestjs/common';
import { PopsController } from './pops.controller';
import { PopsService } from './pops.service';
import { PopsRepository } from './repositories/pops.repository';
import { AdminGuard } from 'src/common/guards/admin.guard';

@Module({
  controllers: [PopsController],
  providers: [PopsService, PopsRepository, AdminGuard],
})
export class PopsModule {}
