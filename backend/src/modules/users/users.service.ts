import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import { Redis } from 'ioredis';
import { redisKey } from 'src/common/redis/redis-keys';
import { Utils } from 'src/common/utils/utils';
import { ClientsRepository } from './repositories/clients.repository';
import { ProfessionalsRepository } from './repositories/professionals.repository';
import { UsersRepository } from './repositories/users.repository';
import { UsersList } from './types/users.interfaces';
import { UsersCreateDTO } from './validation/users-create.DTO';
import { UsersListDTO } from './validation/users-list.DTO';
import { ContactChangeRequestDTO } from './validation/contact-change-request.dto';
import { ContactChangeVerifyDTO } from './validation/contact-change-verify.dto';
import { UserUpdateDTO } from './validation/users-update.DTO';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly clientsRepository: ClientsRepository,
        private readonly professionalsRepository: ProfessionalsRepository,
        private readonly configService: ConfigService,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) {}

    private get siteId() {
        return this.configService.get<string>('SITE_ID');
    }

    logger = new Logger(UsersService.name);

    async createUser(userCreateDTO: UsersCreateDTO) {
        try {
            return await this.usersRepository.create(userCreateDTO);
        } catch (error) {
            Utils.logError(this.logger, 'Failed to create user', error);
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
            Utils.logError(this.logger, 'Failed to create client', error);
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
            Utils.logError(this.logger, 'Failed to create professional', error);
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
            Utils.logError(this.logger, 'Failed to list users', error);
            Utils.handleError(error);
        }
    }

    async findById(id: number) {
        try {
            return await this.usersRepository.getById(id);
        } catch (error) {
            Utils.logError(this.logger, 'Failed to find user by ID', error);
            Utils.handleError(error);
        }
    }

    async updateUser(id: number, userUpdateDTO: UserUpdateDTO) {
        try {
            const current = await this.usersRepository.getById(id);
            if (!current) {
                throw new NotFoundException('User not found');
            }
            if (
                userUpdateDTO.phone_number !== undefined &&
                userUpdateDTO.phone_number !== current.phone_number
            ) {
                throw new BadRequestException(
                    'Alteração de telefone exige verificação do novo contato',
                );
            }
            if (
                userUpdateDTO.email !== undefined &&
                userUpdateDTO.email !== current.email
            ) {
                throw new BadRequestException(
                    'Alteração de e-mail exige verificação do novo contato',
                );
            }
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

            await this.redis.del(redisKey(this.siteId, 'user', id));

            return await this.usersRepository.update(id, userUpdateDTO);
        } catch (error) {
            Utils.logError(this.logger, 'Failed to update user', error);
            Utils.handleError(error);
        }
    }

    async deleteUser(id: number) {
        try {
            await this.redis.del(redisKey(this.siteId, 'user', id));
            return await this.usersRepository.delete(id);
        } catch (error) {
            Utils.logError(this.logger, 'Failed to delete user', error);
            Utils.handleError(error);
        }
    }

    async findByPhoneNumber(phone_number: string) {
        try {
            return await this.usersRepository.findByPhoneNumber(phone_number);
        } catch (error) {
            Utils.logError(
                this.logger,
                'Failed to find user by phone number',
                error,
            );
            Utils.handleError(error);
        }
    }

    async findByEmail(email: string) {
        try {
            return await this.usersRepository.findByEmail(email);
        } catch (error) {
            Utils.logError(this.logger, 'Failed to find user by email', error);
            Utils.handleError(error);
        }
    }

    async requestContactChange(id: number, dto: ContactChangeRequestDTO) {
        const user = await this.usersRepository.getById(id);
        if (!user) throw new NotFoundException('User not found');
        const value = dto.value.trim();
        if (dto.field === 'phone') {
            if (!/^\d{11}$/.test(value)) {
                throw new BadRequestException(
                    'Telefone deve conter exatamente 11 dígitos',
                );
            }
            const existing =
                await this.usersRepository.findByPhoneNumber(value);
            if (existing && existing.id !== id) {
                throw new BadRequestException(
                    'Número de telefone já cadastrado',
                );
            }
        } else {
            const existing = await this.usersRepository.findByEmail(value);
            if (existing && existing.id !== id) {
                throw new BadRequestException('Email já cadastrado');
            }
        }

        const code = String(randomInt(100000, 1000000));
        await this.redis.setex(
            redisKey(this.siteId, 'contact_change', id, dto.field),
            300,
            JSON.stringify({ value, code }),
        );
        this.logger.log(`Contact change code for ${value}: ${code}`);
        return {
            message: 'Código enviado para o novo contato',
            expires_in: 300,
        };
    }

    async verifyContactChange(id: number, dto: ContactChangeVerifyDTO) {
        const key = redisKey(
            this.siteId,
            'contact_change',
            id,
            dto.field,
        );
        const stored = await this.redis.get(key);
        if (!stored) {
            throw new UnauthorizedException('Código inválido ou expirado');
        }
        const parsed = JSON.parse(stored) as { value: string; code: string };
        if (parsed.value !== dto.value.trim() || parsed.code !== dto.code) {
            throw new UnauthorizedException('Código inválido ou expirado');
        }
        await this.redis.del(key);
        if (dto.field === 'phone') {
            await this.changePhoneNumber(id, dto.value.trim());
        } else {
            await this.changeEmail(id, dto.value.trim());
        }
        return { message: 'Contato atualizado com sucesso' };
    }

    async changeEmail(id: number, email: string) {
        const existing = await this.usersRepository.findByEmail(email);
        if (existing && existing.id !== id) {
            throw new BadRequestException('Email já cadastrado');
        }
        await this.redis.del(redisKey(this.siteId, 'user', id));
        return await this.usersRepository.update(id, {
            email,
        } as UserUpdateDTO);
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

            await this.redis.del(redisKey(this.siteId, 'user', id));
            return await this.usersRepository.update(id, {
                phone_number,
            } as UserUpdateDTO);
        } catch (error) {
            Utils.logError(this.logger, 'Failed to change phone number', error);
            Utils.handleError(error);
        }
    }

    async findProfessionalById(id: number) {
        try {
            return await this.professionalsRepository.getById(id);
        } catch (error) {
            Utils.logError(
                this.logger,
                'Failed to find professional by ID',
                error,
            );
            Utils.handleError(error);
        }
    }

    async findAllProfessionals() {
        try {
            return await this.professionalsRepository.findAll();
        } catch (error) {
            Utils.logError(
                this.logger,
                'Failed to find all professionals',
                error,
            );
            Utils.handleError(error);
        }
    }
}
