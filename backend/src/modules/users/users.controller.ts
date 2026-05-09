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
    UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSchema } from '@nestjs/swagger';
import {
    AdminGuard,
    AdminOrSelfGuard,
    AuthGuard,
    ProfessionalOrSelfGuard,
} from 'src/modules/auth/guards';
import { UsersList } from './types/users.interfaces';
import { UsersService } from './users.service';
import { UsersCreateDTO } from './validation/users-create.DTO';
import { UsersListDTO } from './validation/users-list.DTO';
import { UserUpdateDTO } from './validation/users-update.DTO';

@ApiSchema({ name: 'Users', description: 'Endpoints relacionados a usuários' })
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

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
    @UseGuards(AuthGuard, AdminGuard)
    @ApiHeader({
        name: 'Authorization',
        description: 'Token de autenticação no formato Bearer <token>',
    })
    @ApiOperation({ summary: 'Lista todos os usuários' })
    async listUsers(@Query() usersListDTO: UsersListDTO): Promise<UsersList> {
        return await this.usersService.listUsers(usersListDTO);
    }

    @Get(':id')
    @UseGuards(AuthGuard, ProfessionalOrSelfGuard)
    @ApiOperation({ summary: 'Obtém um usuário por ID' })
    @ApiHeader({
        name: 'Authorization',
        description: 'Token de autenticação no formato Bearer <token>',
    })
    async findById(@Param('id', ParseIntPipe) id: number) {
        return await this.usersService.findById(id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard, AdminOrSelfGuard)
    @ApiHeader({
        name: 'Authorization',
        description: 'Token de autenticação no formato Bearer <token>',
    })
    @ApiOperation({ summary: 'Atualiza um usuário por ID' })
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() userUpdateDTO: UserUpdateDTO,
    ) {
        return await this.usersService.updateUser(id, userUpdateDTO);
    }

    @Delete(':id')
    @UseGuards(AuthGuard, AdminOrSelfGuard)
    @ApiHeader({
        name: 'Authorization',
        description: 'Token de autenticação no formato Bearer <token>',
    })
    @ApiOperation({ summary: 'Exclui um usuário por ID' })
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
        return await this.usersService.deleteUser(id);
    }
}
