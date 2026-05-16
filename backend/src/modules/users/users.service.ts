import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { Utils } from 'src/common/utils/utils';
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
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) {}

    logger = new Logger(UsersService.name);

    async createUser(userCreateDTO: UsersCreateDTO) {
        try {
            return await this.usersRepository.create(userCreateDTO);
        } catch (error) {
            this.logger.error(`Failed to create user: ${error}`);
            Utils.handleError(error);
        }
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
            this.logger.error(`Failed to create client: ${error}`);
            Utils.handleError(error);
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
            this.logger.error(`Failed to create professional: ${error}`);
            Utils.handleError(error);
        }
    }

    async listUsers(usersListDTO: UsersListDTO): Promise<UsersList> {
        try {
            const listUser = await this.usersRepository.list(usersListDTO);
            return {
                total: listUser.count,
                page: usersListDTO.page,
                limit: usersListDTO.limit,
                users: listUser.rows,
            };
        } catch (error) {
            this.logger.error(`Failed to list users: ${error}`);
            Utils.handleError(error);
        }
    }

    async findById(id: number) {
        try {
            return await this.usersRepository.getById(id);
        } catch (error) {
            this.logger.error(`Failed to find user by ID: ${error}`);
            Utils.handleError(error);
        }
    }

    async updateUser(id: number, userUpdateDTO: UserUpdateDTO) {
        try {
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
                throw new BadRequestException(
                    'Número de telefone já cadastrado',
                );
            }

            if (
                !!userUpdateDTO.email &&
                !!(await this.usersRepository.findByEmail(
                    userUpdateDTO.email,
                )) &&
                !(await this.usersRepository.isUserEmail(
                    id,
                    userUpdateDTO.email,
                ))
            ) {
                throw new BadRequestException('Email já cadastrado');
            }

            await this.redis.del(`user:${id}`);

            return await this.usersRepository.update(id, userUpdateDTO);
        } catch (error) {
            this.logger.error(`Failed to update user: ${error}`);
            Utils.handleError(error);
        }
    }

    async deleteUser(id: number) {
        try {
            await this.redis.del(`user:${id}`);
            return await this.usersRepository.delete(id);
        } catch (error) {
            this.logger.error(`Failed to delete user: ${error}`);
            Utils.handleError(error);
        }
    }

    async findByPhoneNumber(phone_number: string) {
        try {
            return await this.usersRepository.findByPhoneNumber(phone_number);
        } catch (error) {
            this.logger.error(`Failed to find user by phone number: ${error}`);
            Utils.handleError(error);
        }
    }

    async findByEmail(email: string) {
        try {
            return await this.usersRepository.findByEmail(email);
        } catch (error) {
            this.logger.error(`Failed to find user by email: ${error}`);
            Utils.handleError(error);
        }
    }

    async changePhoneNumber(id: number, phone_number: string) {
        try {
            if (
                !!(await this.usersRepository.findByPhoneNumber(
                    phone_number,
                )) &&
                !(await this.usersRepository.isUserPhoneNumber(
                    id,
                    phone_number,
                ))
            ) {
                throw new BadRequestException(
                    'Número de telefone já cadastrado',
                );
            }

            await this.redis.del(`user:${id}`);
            return await this.usersRepository.update(id, {
                phone_number,
            } as UserUpdateDTO);
        } catch (error) {
            this.logger.error(`Failed to change phone number: ${error}`);
            Utils.handleError(error);
        }
    }

    async findProfessionalById(id: number) {
        try {
            return await this.professionalsRepository.getById(id);
        } catch (error) {
            this.logger.error(`Failed to find professional by ID: ${error}`);
            Utils.handleError(error);
        }
    }

    async findAllProfessionals() {
        try {
            return await this.professionalsRepository.findAll();
        } catch (error) {
            this.logger.error(`Failed to find all professionals: ${error}`);
            Utils.handleError(error);
        }
    }
}
