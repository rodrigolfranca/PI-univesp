import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ClientsRepository } from './repositories/clients.repository';
import { ProfessionalsRepository } from './repositories/professionals.repository';
import { UsersRepository } from './repositories/users.repository';
import { UsersList } from './types/users.interfaces';
import { UsersCreateDTO } from './validation/users-create.DTO';
import { UsersListDTO } from './validation/users-list.DTO';
import { UserUpdateDTO } from './validation/users-update.DTO';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly clientsRepository: ClientsRepository,
        private readonly professionalsRepository: ProfessionalsRepository,
    ) { }

    async createUser(userCreateDTO: UsersCreateDTO) {
        return await this.usersRepository.create(userCreateDTO);
    }

    async createClient(userCreateDTO: UsersCreateDTO) {
        const dbTransaction = await this.usersRepository.startTransaction();
        try {
            if (
                await this.usersRepository.findByPhoneNumber(
                    userCreateDTO.phone_number,
                )
            ) {
                throw new BadRequestException(
                    'Número de telefone já cadastrado',
                );
            }

            if (await this.usersRepository.findByEmail(userCreateDTO.email)) {
                throw new BadRequestException('Email já cadastrado');
            }

            const user = await this.usersRepository.create(
                userCreateDTO,
                dbTransaction,
            );
            const client = await this.clientsRepository.create(
                user,
                dbTransaction,
            );
            await dbTransaction.commit();
            return client;
        } catch (error) {
            await dbTransaction.rollback();
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Erro ao criar cliente');
        }
    }

    async createProfessional(userCreateDTO: UsersCreateDTO) {
        const dbTransaction = await this.usersRepository.startTransaction();
        try {
            if (
                await this.usersRepository.findByPhoneNumber(
                    userCreateDTO.phone_number,
                )
            ) {
                throw new BadRequestException(
                    'Número de telefone já cadastrado',
                );
            }

            if (await this.usersRepository.findByEmail(userCreateDTO.email)) {
                throw new BadRequestException('Email já cadastrado');
            }

            const user = await this.usersRepository.create(
                userCreateDTO,
                dbTransaction,
            );
            const professional = await this.professionalsRepository.create(
                user,
                userCreateDTO.is_admin,
                dbTransaction,
            );
            await dbTransaction.commit();
            return professional;
        } catch (error) {
            await dbTransaction.rollback();
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Erro ao criar profissional',
            );
        }
    }

    async listUsers(usersListDTO: UsersListDTO): Promise<UsersList> {
        const listUser = await this.usersRepository.list(usersListDTO);
        return {
            total: listUser.count,
            page: usersListDTO.page,
            limit: usersListDTO.limit,
            users: listUser.rows,
        };
    }

    async getUserById(id: number) {
        return await this.usersRepository.getById(id);
    }

    async updateUser(id: number, userUpdateDTO: UserUpdateDTO) {
        if (
            !!userUpdateDTO.phone_number &&
            !!(await this.usersRepository.findByPhoneNumber(
                userUpdateDTO.phone_number,
            )) &&
            !(await this.usersRepository.isUserPhoneNumber(
                id,
                userUpdateDTO.phone_number,
            ))
        ) {
            throw new BadRequestException('Número de telefone já cadastrado');
        }

        if (
            !!userUpdateDTO.email &&
            !!(await this.usersRepository.findByEmail(userUpdateDTO.email)) &&
            !(await this.usersRepository.isUserEmail(id, userUpdateDTO.email))
        ) {
            throw new BadRequestException('Email já cadastrado');
        }

        return await this.usersRepository.update(id, userUpdateDTO);
    }

    async deleteUser(id: number) {
        return await this.usersRepository.delete(id);
    }

    async findByPhoneNumber(phone_number: string) {
        return await this.usersRepository.findByPhoneNumber(phone_number);
    }
}
