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
import {
    OTP_RESEND_AFTER_SECONDS,
    OTP_TTL_SECONDS,
} from '../../common/otp/otp.constants';
import { redisKey } from '../../common/redis/redis-keys';
import { UserWithType } from '../../common/types/users.type';
import { Utils } from '../../common/utils/utils';
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
                    'Este telefone já está cadastrado em outra conta.',
                );
            }

            if (await this.usersRepository.findByEmail(userCreateDTO.email)) {
                throw new BadRequestException(
                    'Este e-mail já está cadastrado em outra conta.',
                );
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

    async createVerifiedClient(data: {
        name: string;
        phone_number: string;
        email: string;
    }) {
        const dbTransaction = await this.usersRepository.startTransaction();
        try {
            if (
                await this.usersRepository.findByPhoneNumber(data.phone_number)
            ) {
                throw new BadRequestException(
                    'Este telefone já está cadastrado em outra conta.',
                );
            }

            if (await this.usersRepository.findByEmail(data.email)) {
                throw new BadRequestException(
                    'Este e-mail já está cadastrado em outra conta.',
                );
            }

            const user = await this.usersRepository.create(
                {
                    ...data,
                    phone_number_confirmed: true,
                    email_confirmed: true,
                    is_admin: false,
                },
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
            Utils.logError(
                this.logger,
                'Failed to create verified client',
                error,
            );
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
                    'Este telefone já está cadastrado em outra conta.',
                );
            }

            if (await this.usersRepository.findByEmail(userCreateDTO.email)) {
                throw new BadRequestException(
                    'Este e-mail já está cadastrado em outra conta.',
                );
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
                    'Este telefone já está cadastrado em outra conta.',
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
                throw new BadRequestException(
                    'Este e-mail já está cadastrado em outra conta.',
                );
            }

            await this.redis.del(redisKey(this.siteId, 'user', id));

            return await this.usersRepository.update(id, userUpdateDTO);
        } catch (error) {
            Utils.logError(this.logger, 'Failed to update user', error);
            Utils.handleError(error);
        }
    }

    async deleteUser(id: number, currentUser?: UserWithType) {
        try {
            if (currentUser?.professional?.is_admin && currentUser.id === id) {
                throw new BadRequestException(
                    'Não é possível excluir a própria conta.',
                );
            }

            const today = new Date().toISOString().slice(0, 10);
            if (
                (await this.usersRepository.countUpcomingSchedules(id, today)) >
                0
            ) {
                throw new BadRequestException(
                    'Não é possível excluir: existem agendamentos futuros para esta conta.',
                );
            }

            const result = await this.usersRepository.delete(id);
            await this.redis.del(redisKey(this.siteId, 'user', id));
            return result;
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
                    'Este telefone já está cadastrado em outra conta.',
                );
            }
            if (value === user.phone_number) {
                throw new BadRequestException(
                    'Este é o telefone atual da conta. Informe um número diferente.',
                );
            }
        } else {
            const existing = await this.usersRepository.findByEmail(value);
            if (existing && existing.id !== id) {
                throw new BadRequestException(
                    'Este e-mail já está cadastrado em outra conta.',
                );
            }
            if (value === user.email) {
                throw new BadRequestException(
                    'Este é o e-mail atual da conta. Informe um e-mail diferente.',
                );
            }
        }

        const code = String(randomInt(100000, 1000000));
        await this.redis.setex(
            redisKey(this.siteId, 'contact_change', id, dto.field),
            OTP_TTL_SECONDS,
            JSON.stringify({ value, code }),
        );
        return {
            message: 'Código enviado para o novo contato',
            expires_in: OTP_TTL_SECONDS,
            resend_after: OTP_RESEND_AFTER_SECONDS,
            demo_code: code,
        };
    }

    async requestEmailConfirmation(id: number) {
        const user = await this.usersRepository.getById(id);
        if (!user) throw new NotFoundException('User not found');

        const code = String(randomInt(100000, 1000000));
        await this.redis.setex(
            redisKey(this.siteId, 'contact_change', id, 'email'),
            OTP_TTL_SECONDS,
            JSON.stringify({ value: user.email, code }),
        );
        return {
            message: 'Código enviado para o e-mail atual',
            expires_in: OTP_TTL_SECONDS,
            resend_after: OTP_RESEND_AFTER_SECONDS,
            demo_code: code,
        };
    }

    async verifyContactChange(id: number, dto: ContactChangeVerifyDTO) {
        const key = redisKey(this.siteId, 'contact_change', id, dto.field);
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
            throw new BadRequestException(
                'Este e-mail já está cadastrado em outra conta.',
            );
        }
        await this.redis.del(redisKey(this.siteId, 'user', id));
        return await this.usersRepository.updateContact(id, {
            email,
            email_confirmed: true,
        });
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
                    'Este telefone já está cadastrado em outra conta.',
                );
            }

            await this.redis.del(redisKey(this.siteId, 'user', id));
            return await this.usersRepository.updateContact(id, {
                phone_number,
                phone_number_confirmed: true,
            });
        } catch (error) {
            Utils.logError(this.logger, 'Failed to change phone number', error);
            Utils.handleError(error);
        }
    }

    async markPhoneConfirmed(id: number) {
        return await this.usersRepository.updateContact(id, {
            phone_number_confirmed: true,
        });
    }

    async markEmailConfirmed(id: number) {
        return await this.usersRepository.updateContact(id, {
            email_confirmed: true,
        });
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
