import { Module } from '@nestjs/common';
import { ClientsRepository } from './repositories/clients.repository';
import { ProfessionalsRepository } from './repositories/professionals.repository';
import { UsersRepository } from './repositories/users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    controllers: [UsersController],
    providers: [UsersService, UsersRepository, ClientsRepository, ProfessionalsRepository],
})
export class UsersModule { }
