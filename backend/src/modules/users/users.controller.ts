import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSchema } from '@nestjs/swagger';
import {
    AdminGuard,
    AdminOrSelfGuard,
    AuthGuard,
    ProfessionalOrSelfGuard,
} from 'src/modules/auth/guards';
import { UsersList } from './types/users.interfaces';
import { UsersService } from './users.service';
import { UsersCreateDTO } from './validation/users-create.DTO';
import { ContactChangeRequestDTO } from './validation/contact-change-request.dto';
import { ContactChangeVerifyDTO } from './validation/contact-change-verify.dto';
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
    @UseGuards(AuthGuard, AdminGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cria um novo profissional' })
    async createProfessional(@Body() userCreateDTO: UsersCreateDTO) {
        return await this.usersService.createProfessional(userCreateDTO);
    }

    @Get()
    @UseGuards(AuthGuard, AdminGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Lista todos os usuários' })
    async listUsers(@Query() usersListDTO: UsersListDTO): Promise<UsersList> {
        return await this.usersService.listUsers(usersListDTO);
    }

    @Get(':id')
    @UseGuards(AuthGuard, ProfessionalOrSelfGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtém um usuário por ID' })
    async findById(@Param('id', ParseIntPipe) id: number) {
        const user = await this.usersService.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    @Patch(':id')
    @UseGuards(AuthGuard, AdminOrSelfGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Atualiza um usuário por ID' })
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() userUpdateDTO: UserUpdateDTO,
    ) {
        return await this.usersService.updateUser(id, userUpdateDTO);
    }

    @Post(':id/contact/request')
    @UseGuards(AuthGuard, AdminOrSelfGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Solicita código para alterar contato' })
    async requestContactChange(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ContactChangeRequestDTO,
    ) {
        return await this.usersService.requestContactChange(id, dto);
    }

    @Post(':id/contact/verify')
    @UseGuards(AuthGuard, AdminOrSelfGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Confirma a alteração de contato' })
    async verifyContactChange(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ContactChangeVerifyDTO,
    ) {
        return await this.usersService.verifyContactChange(id, dto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard, AdminOrSelfGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Exclui um usuário por ID' })
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
        return await this.usersService.deleteUser(id);
    }
}
