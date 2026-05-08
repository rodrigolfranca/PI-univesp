import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiOperation, ApiSchema } from '@nestjs/swagger';
import { UsersList } from './types/users.interfaces';
import { UsersService } from './users.service';
import { UsersCreateDTO } from './validation/users-create.DTO';
import { UsersListDTO } from './validation/users-list.DTO';
import { UserUpdateDTO } from './validation/users-update.DTO';

@ApiSchema({ name: 'Users', description: 'Endpoints relacionados a usuários' })
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('client')
    @ApiOperation({ summary: 'Cria um novo cliente' })
    async createClient(@Body() userCreateDTO: UsersCreateDTO) {
        return await this.usersService.createClient(userCreateDTO);
    }

    @Post('professional')
    @ApiOperation({ summary: 'Cria um novo profissional' })
    async createProfessional(@Body() userCreateDTO: UsersCreateDTO) {
        return await this.usersService.createProfessional(userCreateDTO);
    }

    @Get()
    @ApiOperation({ summary: 'Lista todos os usuários' })
    async listUsers(@Query() usersListDTO: UsersListDTO): Promise<UsersList> {
        return await this.usersService.listUsers(usersListDTO);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtém um usuário por ID' })
    async getUserById(@Param('id', ParseIntPipe) id: number) {
        return await this.usersService.getUserById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Atualiza um usuário por ID' })
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() userUpdateDTO: UserUpdateDTO,
    ) {
        return await this.usersService.updateUser(id, userUpdateDTO);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Exclui um usuário por ID' })
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
        return await this.usersService.deleteUser(id);
    }
}
