import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { Redis } from 'ioredis';
import request from 'supertest';
import { App } from 'supertest/types';
import {
    Category,
    Client,
    GalleryImage,
    Procedure,
    ProcedureProfessional,
    Professional,
    Schedule,
    ScheduleException,
    SiteBrand,
    User,
    WorkSchedule,
} from '../src/common/models';
import { redisKey } from '../src/common/redis/redis-keys';
import {
    ACCESS_TOKEN_TTL_SECONDS,
    sessionKey,
} from '../src/modules/auth/session-key';
import { closeE2EApp, createE2EApp } from './utils/create-e2e-app';

type TestUser = {
    user: User;
    professional: Professional;
};

type TestClient = {
    user: User;
    client: Client;
};

describe('API (e2e)', () => {
    let app: INestApplication<App>;
    let redis: Redis;
    let siteId: string | undefined;
    let admin: TestUser;
    let professional: TestUser;
    let adminToken: string;
    let professionalToken: string;
    let testClient: TestClient;
    let clientToken: string;
    const createdUsers: TestUser[] = [];
    const createdClients: TestClient[] = [];
    const createdProcedureIds: number[] = [];
    const createdExceptionIds: number[] = [];
    const createdCategoryIds: number[] = [];
    const createdGalleryIds: number[] = [];
    let createdBrandId: number | null = null;

    async function createTestClient(): Promise<TestClient> {
        const suffix = String(Date.now()).slice(-8);
        const user = await User.create({
            name: 'E2E Client',
            phone_number: `11${suffix}`,
            phone_number_confirmed: true,
            email: `e2e-client-${suffix}@example.com`,
        });
        const client = await Client.create({ user_id: user.id });
        const result = { user, client };
        createdClients.push(result);
        return result;
    }

    async function createTestUser(is_admin: boolean): Promise<TestUser> {
        const suffix = String(Date.now()).slice(-8);
        const user = await User.create({
            name: is_admin ? 'E2E Admin' : 'E2E Professional',
            phone_number: `11${is_admin ? '9' : '8'}${suffix}`,
            phone_number_confirmed: true,
            email: `e2e-${is_admin ? 'admin' : 'professional'}-${suffix}@example.com`,
        });
        const professional = await Professional.create({
            user_id: user.id,
            is_admin,
        });
        const testUser = { user, professional };
        createdUsers.push(testUser);
        return testUser;
    }

    beforeAll(async () => {
        app = (await createE2EApp()) as INestApplication<App>;
        redis = app.get<Redis>('REDIS_CLIENT');
        const jwtService = app.get(JwtService);
        siteId = app.get(ConfigService).get<string>('SITE_ID');

        async function issueToken(userId: number): Promise<string> {
            const jti = randomUUID();
            await redis.setex(
                sessionKey(siteId, jti),
                ACCESS_TOKEN_TTL_SECONDS,
                String(userId),
            );
            return jwtService.signAsync({
                keyType: 'access',
                id: userId,
                jti,
            });
        }

        admin = await createTestUser(true);
        professional = await createTestUser(false);
        adminToken = await issueToken(admin.user.id);
        professionalToken = await issueToken(professional.user.id);
        testClient = await createTestClient();
        clientToken = await issueToken(testClient.user.id);
    });

    afterAll(async () => {
        try {
            if (professional) {
                await WorkSchedule.destroy({
                    where: { professional_id: professional.professional.id },
                    force: true,
                });
            }
            for (const { professional } of createdUsers) {
                await WorkSchedule.destroy({
                    where: { professional_id: professional.id },
                    force: true,
                });
                await Schedule.destroy({
                    where: { professional_id: professional.id },
                    force: true,
                });
            }
            for (const { client } of createdClients) {
                await Schedule.destroy({
                    where: { client_id: client.id },
                    force: true,
                });
            }
            for (const id of createdProcedureIds) {
                await ProcedureProfessional.destroy({
                    where: { procedure_id: id },
                    force: true,
                });
                await Procedure.destroy({ where: { id }, force: true });
            }
            for (const id of createdExceptionIds) {
                await ScheduleException.destroy({ where: { id }, force: true });
            }
            for (const id of createdCategoryIds) {
                await Category.destroy({ where: { id }, force: true });
            }
            for (const id of createdGalleryIds) {
                await GalleryImage.destroy({ where: { id }, force: true });
            }
            if (createdBrandId) {
                await SiteBrand.destroy({
                    where: { id: createdBrandId },
                    force: true,
                });
            }
            for (const { user, professional } of createdUsers) {
                await redis.del(redisKey(siteId, 'user', user.id));
                await Professional.destroy({
                    where: { id: professional.id },
                    force: true,
                });
                await User.destroy({ where: { id: user.id }, force: true });
            }
            for (const { user, client } of createdClients) {
                await redis.del(redisKey(siteId, 'user', user.id));
                await Client.destroy({ where: { id: client.id }, force: true });
                await User.destroy({ where: { id: user.id }, force: true });
            }
        } finally {
            await closeE2EApp(app);
        }
    });

    it('GET /documentation-json expõe o OpenAPI', () => {
        return request(app.getHttpServer())
            .get('/documentation-json')
            .expect(200)
            .expect((res) => {
                const body = res.body as { openapi?: string };
                expect(body.openapi).toBeDefined();
            });
    });

    it('POST /auth/request-code valida telefone', () => {
        return request(app.getHttpServer())
            .post('/auth/request-code')
            .send({ phone_number: 'invalido' })
            .expect(400);
    });

    it('POST /auth/request-code retorna 404 para telefone não cadastrado', () => {
        return request(app.getHttpServer())
            .post('/auth/request-code')
            .send({ phone_number: '11999999999' })
            .expect(404)
            .expect((res) => {
                const body = res.body as { message: string };
                expect(body.message).toBe('Telefone não cadastrado');
            });
    });

    it('GET /procedures responde sem autenticação', () => {
        return request(app.getHttpServer())
            .get('/procedures')
            .expect(200)
            .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
            });
    });

    describe('Autorização admin', () => {
        it('GET /users sem token retorna 401', () => {
            return request(app.getHttpServer()).get('/users').expect(401);
        });

        it('GET /users com JWT de profissional retorna 401', () => {
            return request(app.getHttpServer())
                .get('/users')
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(401);
        });

        it('GET /users com JWT de admin retorna 200', () => {
            return request(app.getHttpServer())
                .get('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as { total?: number };
                    expect(body.total).toBeDefined();
                });
        });

        it('POST /procedures com JWT de profissional retorna 401', () => {
            return request(app.getHttpServer())
                .post('/procedures')
                .set('Authorization', `Bearer ${professionalToken}`)
                .send({})
                .expect(401);
        });

        it('POST /schedules com cliente para outro cliente retorna 401', () => {
            return request(app.getHttpServer())
                .post('/schedules')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ client_id: testClient.client.id + 1 })
                .expect(401);
        });

        it('POST /schedules com cliente para o próprio client_id passa da autorização', () => {
            return request(app.getHttpServer())
                .post('/schedules')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({ client_id: testClient.client.id })
                .expect(400);
        });

        it('POST /schedules com JWT de profissional retorna 401', () => {
            return request(app.getHttpServer())
                .post('/schedules')
                .set('Authorization', `Bearer ${professionalToken}`)
                .send({})
                .expect(401);
        });

        it('GET /google-calendar/status com JWT de profissional retorna 401', () => {
            return request(app.getHttpServer())
                .get('/google-calendar/status')
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(401);
        });

        it('POST /google-calendar/sync com JWT de profissional retorna 401', () => {
            return request(app.getHttpServer())
                .post('/google-calendar/sync')
                .set('Authorization', `Bearer ${professionalToken}`)
                .send({})
                .expect(401);
        });

        it('POST /google-calendar/sync com JWT de admin retorna 200', () => {
            return request(app.getHttpServer())
                .post('/google-calendar/sync')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(200)
                .expect((res) => {
                    const body = res.body as {
                        connected?: boolean;
                        synced?: number;
                        failed?: number;
                    };
                    expect(typeof body.connected).toBe('boolean');
                    expect(typeof body.synced).toBe('number');
                    expect(typeof body.failed).toBe('number');
                });
        });

        it('GET /work-schedules com JWT de admin retorna 200', () => {
            return request(app.getHttpServer())
                .get('/work-schedules')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('profissional gerencia apenas a própria disponibilidade', async () => {
            const ownProfessionalId = professional.professional.id;
            const otherProfessionalId = admin.professional.id;
            const exceptionDate = '2031-01-07';
            const day = new Date(`${exceptionDate}T00:00:00Z`).getUTCDay();

            await request(app.getHttpServer())
                .get('/work-schedules')
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as { professional_id: number }[];
                    expect(
                        body.every(
                            (entry) =>
                                entry.professional_id === ownProfessionalId,
                        ),
                    ).toBe(true);
                });

            await request(app.getHttpServer())
                .get(`/work-schedules?professional_id=${otherProfessionalId}`)
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(403);

            await request(app.getHttpServer())
                .post('/work-schedules')
                .set('Authorization', `Bearer ${professionalToken}`)
                .send({
                    professional_id: otherProfessionalId,
                    days_of_week: [day],
                    start_time: '09:00',
                    end_time: '18:00',
                })
                .expect(403);

            await request(app.getHttpServer())
                .post('/work-schedules')
                .set('Authorization', `Bearer ${professionalToken}`)
                .send({
                    professional_id: ownProfessionalId,
                    days_of_week: [day],
                    start_time: '09:00',
                    end_time: '18:00',
                })
                .expect(201);

            const ownSchedules = await request(app.getHttpServer())
                .get(`/work-schedules?professional_id=${ownProfessionalId}`)
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(200);
            const ownSchedule = (
                ownSchedules.body as { id: number; day_of_week: number }[]
            ).find((entry) => entry.day_of_week === day)!;

            await request(app.getHttpServer())
                .patch(`/work-schedules/update/${ownSchedule.id}`)
                .set('Authorization', `Bearer ${professionalToken}`)
                .send({ start_time: '10:00' })
                .expect(200);

            await request(app.getHttpServer())
                .post('/schedule-exceptions')
                .set('Authorization', `Bearer ${professionalToken}`)
                .send({
                    professional_id: otherProfessionalId,
                    date: exceptionDate,
                    type: 'blocked',
                    start_time: '10:00',
                    end_time: '11:00',
                })
                .expect(403);

            await request(app.getHttpServer())
                .get(
                    `/schedule-exceptions?professional_id=${otherProfessionalId}`,
                )
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(403);

            const ownException = await request(app.getHttpServer())
                .post('/schedule-exceptions')
                .set('Authorization', `Bearer ${professionalToken}`)
                .send({
                    professional_id: ownProfessionalId,
                    date: exceptionDate,
                    type: 'blocked',
                    start_time: '10:00',
                    end_time: '11:00',
                })
                .expect(201);
            const ownExceptionId = (ownException.body as { id: number }).id;
            createdExceptionIds.push(ownExceptionId);

            await request(app.getHttpServer())
                .get(
                    `/schedule-exceptions?professional_id=${ownProfessionalId}`,
                )
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(200);

            await request(app.getHttpServer())
                .patch(`/schedule-exceptions/${ownExceptionId}`)
                .set('Authorization', `Bearer ${professionalToken}`)
                .send({ name: 'Bloqueio próprio' })
                .expect(200);

            const adminSchedule = await request(app.getHttpServer())
                .post('/work-schedules')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    professional_id: otherProfessionalId,
                    days_of_week: [day],
                    start_time: '09:00',
                    end_time: '18:00',
                })
                .expect(201);
            expect(
                (adminSchedule.body as { message: string }).message,
            ).toBeDefined();

            const otherSchedules = await request(app.getHttpServer())
                .get(`/work-schedules?professional_id=${otherProfessionalId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            const otherSchedule = (
                otherSchedules.body as { id: number; day_of_week: number }[]
            ).find((entry) => entry.day_of_week === day)!;

            await request(app.getHttpServer())
                .patch(`/work-schedules/update/${otherSchedule.id}`)
                .set('Authorization', `Bearer ${professionalToken}`)
                .send({ start_time: '10:00' })
                .expect(403);

            await request(app.getHttpServer())
                .delete(`/work-schedules/delete/${otherSchedule.id}`)
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(403);

            const otherException = await request(app.getHttpServer())
                .post('/schedule-exceptions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    professional_id: otherProfessionalId,
                    date: exceptionDate,
                    type: 'blocked',
                    start_time: '10:00',
                    end_time: '11:00',
                })
                .expect(201);
            const otherExceptionId = (otherException.body as { id: number }).id;
            createdExceptionIds.push(otherExceptionId);

            await request(app.getHttpServer())
                .patch(`/schedule-exceptions/${otherExceptionId}`)
                .set('Authorization', `Bearer ${professionalToken}`)
                .send({ name: 'Tentativa' })
                .expect(403);

            await request(app.getHttpServer())
                .delete(`/schedule-exceptions/${otherExceptionId}`)
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(403);

            await request(app.getHttpServer())
                .delete(`/schedule-exceptions/${ownExceptionId}`)
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(200);

            const general = await Category.findOne({
                where: { name: 'Geral' },
            });
            const availabilityProcedure = await request(app.getHttpServer())
                .post('/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    category_id: general!.id,
                    professional_ids: [ownProfessionalId],
                    name: 'Procedimento Datas E2E',
                    description: 'Teste',
                    duration_minutes: 30,
                    price: 100,
                    sessions: 1,
                    triagem: false,
                    triagem_minutes: 0,
                })
                .expect(201);
            const availabilityProcedureId = (
                availabilityProcedure.body as { id: number }
            ).id;
            createdProcedureIds.push(availabilityProcedureId);

            const availableDates = await request(app.getHttpServer())
                .get(
                    `/work-schedules/available-dates?procedure_id=${availabilityProcedureId}&from=${exceptionDate}&to=${exceptionDate}`,
                )
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(200);
            expect(
                (availableDates.body as { dates: string[] }).dates,
            ).toContain(exceptionDate);

            const summary = await request(app.getHttpServer())
                .get(
                    `/work-schedules/availability-summary?from=${exceptionDate}&to=${exceptionDate}`,
                )
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(200);
            expect(summary.body).toContainEqual({
                procedure_id: availabilityProcedureId,
                next_date: exceptionDate,
            });

            await request(app.getHttpServer())
                .delete(`/work-schedules/delete/${ownSchedule.id}`)
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(200);
        });

        it('GET /google-calendar/status com JWT de admin retorna 200', () => {
            return request(app.getHttpServer())
                .get('/google-calendar/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as { connected?: boolean };
                    expect(typeof body.connected).toBe('boolean');
                });
        });
    });

    describe('Consulta por telefone', () => {
        it('admin consulta por telefone', () => {
            return request(app.getHttpServer())
                .get(
                    `/users/by-phone?phone_number=${professional.user.phone_number}`,
                )
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as { id?: number };
                    expect(body.id).toBe(professional.user.id);
                });
        });

        it('profissional não consulta por telefone', () => {
            return request(app.getHttpServer())
                .get(
                    `/users/by-phone?phone_number=${professional.user.phone_number}`,
                )
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(401);
        });

        it('cliente não consulta por telefone', () => {
            return request(app.getHttpServer())
                .get(
                    `/users/by-phone?phone_number=${professional.user.phone_number}`,
                )
                .set('Authorization', `Bearer ${clientToken}`)
                .expect(401);
        });
    });

    describe('Acesso do profissional a usuários', () => {
        it('profissional não consulta outro usuário por ID', () => {
            return request(app.getHttpServer())
                .get(`/users/${testClient.user.id}`)
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(401);
        });
    });

    describe('Categorias', () => {
        it('GET /categories é público e contém Geral', () => {
            return request(app.getHttpServer())
                .get('/categories')
                .expect(200)
                .expect((res) => {
                    const body = res.body as { name: string }[];
                    expect(
                        body.some((category) => category.name === 'Geral'),
                    ).toBe(true);
                });
        });

        it('POST /categories como profissional retorna 401', () => {
            return request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${professionalToken}`)
                .send({ name: 'Categoria Prof' })
                .expect(401);
        });

        it('não edita nem exclui a categoria Geral', async () => {
            const general = await Category.findOne({
                where: { name: 'Geral' },
            });

            await request(app.getHttpServer())
                .patch(`/categories/${general!.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Geral Editada' })
                .expect(400);

            await request(app.getHttpServer())
                .delete(`/categories/${general!.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            await expect(Category.findByPk(general!.id)).resolves.toMatchObject(
                { name: 'Geral' },
            );
        });

        it('admin cria, edita e exclui categoria livre', async () => {
            const created = await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: `Categoria E2E ${Date.now()}` })
                .expect(201);
            const id = (created.body as { id: number }).id;
            createdCategoryIds.push(id);

            await request(app.getHttpServer())
                .patch(`/categories/${id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: `Categoria E2E Editada ${Date.now()}` })
                .expect(200);

            await request(app.getHttpServer())
                .delete(`/categories/${id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('não exclui categoria vinculada a procedimento', async () => {
            const category = await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: `Categoria Vinculada ${Date.now()}` })
                .expect(201);
            const categoryId = (category.body as { id: number }).id;
            createdCategoryIds.push(categoryId);

            const procedure = await request(app.getHttpServer())
                .post('/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    category_id: categoryId,
                    professional_ids: [admin.professional.id],
                    name: 'Procedimento Categoria E2E',
                    description: 'Teste',
                    duration_minutes: 30,
                    price: 100,
                    sessions: 1,
                    triagem: false,
                    triagem_minutes: 0,
                })
                .expect(201);
            const procedureId = (procedure.body as { id: number }).id;
            createdProcedureIds.push(procedureId);

            await request(app.getHttpServer())
                .delete(`/categories/${categoryId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            await ProcedureProfessional.destroy({
                where: { procedure_id: procedureId },
                force: true,
            });
            await Procedure.destroy({
                where: { id: procedureId },
                force: true,
            });
            createdProcedureIds.splice(
                createdProcedureIds.indexOf(procedureId),
                1,
            );

            await request(app.getHttpServer())
                .delete(`/categories/${categoryId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });
    });

    describe('Alteração de contato', () => {
        it('PATCH /users/:id não altera telefone sem verificação', () => {
            return request(app.getHttpServer())
                .patch(`/users/${testClient.user.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ phone_number: `119${String(Date.now()).slice(-8)}` })
                .expect(400);
        });

        it('altera telefone após código enviado ao novo contato', async () => {
            const phone = `119${String(Date.now()).slice(-8)}`;
            await request(app.getHttpServer())
                .post(`/users/${testClient.user.id}/contact/request`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ field: 'phone', value: phone })
                .expect(201);

            const stored = await redis.get(
                redisKey(siteId, 'contact_change', testClient.user.id, 'phone'),
            );
            expect(stored).toBeTruthy();
            const { code } = JSON.parse(stored!) as { code: string };

            await request(app.getHttpServer())
                .post(`/users/${testClient.user.id}/contact/verify`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ field: 'phone', value: phone, code })
                .expect(201);

            testClient.user.phone_number = phone;
            await request(app.getHttpServer())
                .get(`/users/${testClient.user.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as { phone_number?: string };
                    expect(body.phone_number).toBe(phone);
                });
        });
    });

    describe('Exclusão de usuários', () => {
        it('admin não exclui a própria conta', () => {
            return request(app.getHttpServer())
                .delete(`/users/${admin.user.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400)
                .expect((res) => {
                    expect(
                        (res.body as { message?: string }).message,
                    ).toContain('própria conta');
                });
        });

        it('bloqueia exclusão com agendamentos futuros e preserva histórico', async () => {
            const general = await Category.findOne({
                where: { name: 'Geral' },
            });
            const victimClient = await createTestClient();
            const victimProfessional = await createTestUser(false);
            const createdProcedure = await request(app.getHttpServer())
                .post('/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    category_id: general!.id,
                    professional_ids: [
                        professional.professional.id,
                        victimProfessional.professional.id,
                    ],
                    name: 'Procedimento Exclusão E2E',
                    description: 'Teste',
                    duration_minutes: 30,
                    price: 100,
                    sessions: 1,
                    triagem: false,
                    triagem_minutes: 0,
                })
                .expect(201);
            const procedureId = (createdProcedure.body as { id: number }).id;
            createdProcedureIds.push(procedureId);

            const futureSchedule = await Schedule.create({
                procedure_id: procedureId,
                professional_id: professional.professional.id,
                client_id: victimClient.client.id,
                date: '2031-01-01',
                start_time: '09:00',
                session: 1,
                status: 'scheduled',
            });

            await request(app.getHttpServer())
                .delete(`/users/${victimClient.user.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400)
                .expect((res) => {
                    expect(
                        (res.body as { message?: string }).message,
                    ).toContain('agendamentos futuros');
                });

            await Schedule.destroy({
                where: { id: futureSchedule.id },
                force: true,
            });

            const historyClient = await createTestClient();
            const pastSchedule = await Schedule.create({
                procedure_id: procedureId,
                professional_id: professional.professional.id,
                client_id: historyClient.client.id,
                date: '2020-01-01',
                start_time: '09:00',
                session: 1,
                status: 'completed',
            });

            await request(app.getHttpServer())
                .delete(`/users/${historyClient.user.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            await request(app.getHttpServer())
                .get(`/schedules?client_id=${historyClient.client.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as {
                        data?: {
                            client?: {
                                name?: string | null;
                                phone_number?: string | null;
                            };
                        }[];
                    };
                    expect(body.data?.[0]?.client?.name).toBe(
                        historyClient.user.name,
                    );
                    expect(body.data?.[0]?.client?.phone_number).toBe(
                        historyClient.user.phone_number,
                    );
                });

            const futureProfessionalSchedule = await Schedule.create({
                procedure_id: procedureId,
                professional_id: victimProfessional.professional.id,
                client_id: testClient.client.id,
                date: '2031-01-02',
                start_time: '10:00',
                session: 1,
                status: 'scheduled',
            });

            await request(app.getHttpServer())
                .delete(`/users/${victimProfessional.user.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400)
                .expect((res) => {
                    expect(
                        (res.body as { message?: string }).message,
                    ).toContain('agendamentos futuros');
                });

            await Schedule.destroy({
                where: {
                    id: [pastSchedule.id, futureProfessionalSchedule.id],
                },
                force: true,
            });
        });
    });

    describe('Procedimentos', () => {
        it('POST /procedures exige categoria', () => {
            return request(app.getHttpServer())
                .post('/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Sem Categoria',
                    description: 'Teste',
                    duration_minutes: 30,
                    price: 100,
                    sessions: 1,
                    triagem: false,
                    triagem_minutes: 0,
                })
                .expect(400);
        });

        it('admin cria procedimento inativo com status no retorno', async () => {
            const general = await Category.findOne({
                where: { name: 'Geral' },
            });
            const created = await request(app.getHttpServer())
                .post('/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    category_id: general!.id,
                    professional_ids: [admin.professional.id],
                    status: 'inactive',
                    name: 'Procedimento Inativo E2E',
                    description: 'Teste',
                    duration_minutes: 30,
                    price: 100,
                    sessions: 1,
                    triagem: false,
                    triagem_minutes: 0,
                })
                .expect(201);
            const id = (created.body as { id: number }).id;
            createdProcedureIds.push(id);
            expect(
                (
                    created.body as {
                        professionals: { id: number; name: string }[];
                    }
                ).professionals,
            ).toEqual([{ id: admin.professional.id, name: admin.user.name }]);

            const updated = await request(app.getHttpServer())
                .patch(`/procedures/${id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    professional_ids: [professional.professional.id],
                })
                .expect(200);
            expect(
                (
                    updated.body as {
                        professionals: { id: number; name: string }[];
                    }
                ).professionals,
            ).toEqual([
                {
                    id: professional.professional.id,
                    name: professional.user.name,
                },
            ]);

            const listed = await request(app.getHttpServer())
                .get('/procedures')
                .expect(200);
            const body = listed.body as { id: number; status: string }[];
            expect(body.find((entry) => entry.id === id)?.status).toBe(
                'inactive',
            );

            const activated = await request(app.getHttpServer())
                .patch(`/procedures/${id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'active' })
                .expect(200);
            expect((activated.body as { status: string }).status).toBe(
                'active',
            );

            const relisted = await request(app.getHttpServer())
                .get('/procedures')
                .expect(200);
            const relistedBody = relisted.body as {
                id: number;
                status: string;
            }[];
            expect(relistedBody.find((entry) => entry.id === id)?.status).toBe(
                'active',
            );
        });

        it('rejeita agendamento de profissional não habilitado', async () => {
            const general = await Category.findOne({
                where: { name: 'Geral' },
            });
            const created = await request(app.getHttpServer())
                .post('/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    category_id: general!.id,
                    professional_ids: [admin.professional.id],
                    name: 'Procedimento Vínculo E2E',
                    description: 'Teste',
                    duration_minutes: 30,
                    price: 100,
                    sessions: 1,
                    triagem: false,
                    triagem_minutes: 0,
                })
                .expect(201);
            const procedureId = (created.body as { id: number }).id;
            createdProcedureIds.push(procedureId);

            const response = await request(app.getHttpServer())
                .post('/schedules')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({
                    procedure_id: procedureId,
                    professional_id: professional.professional.id,
                    client_id: testClient.client.id,
                    date: '2026-12-07',
                    start_time: '09:00',
                    session: 1,
                })
                .expect(400);

            expect((response.body as { message: string }).message).toContain(
                'não está habilitado',
            );

            await request(app.getHttpServer())
                .post('/schedules')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    procedure_id: procedureId,
                    professional_id: professional.professional.id,
                    client_id: testClient.client.id,
                    date: '2026-12-07',
                    start_time: '09:00',
                    session: 1,
                })
                .expect(400);
        });

        it('filtra disponibilidade pelos profissionais do procedimento', async () => {
            const general = await Category.findOne({
                where: { name: 'Geral' },
            });
            const created = await request(app.getHttpServer())
                .post('/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    category_id: general!.id,
                    professional_ids: [admin.professional.id],
                    name: 'Procedimento Disponibilidade E2E',
                    description: 'Teste',
                    duration_minutes: 30,
                    price: 100,
                    sessions: 1,
                    triagem: false,
                    triagem_minutes: 0,
                })
                .expect(201);
            const procedureId = (created.body as { id: number }).id;
            createdProcedureIds.push(procedureId);

            const availability = await request(app.getHttpServer())
                .get(
                    `/work-schedules/all?day_of_week=1&procedure_id=${procedureId}`,
                )
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const professionals = Object.keys(availability.body as object);
            expect(professionals).toContain(admin.user.name);
            expect(professionals).not.toContain(professional.user.name);
        });
    });

    describe('Limite de upload', () => {
        it('rejeita POP acima de 4,5 MB', () => {
            return request(app.getHttpServer())
                .post('/pops')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.alloc(4.5 * 1024 * 1024 + 1), {
                    filename: 'grande.pdf',
                    contentType: 'application/pdf',
                })
                .expect(413);
        });
    });

    describe('Site', () => {
        const brandPayload = {
            name: 'Studio E2E',
            logoUrl: null,
            theme: { preset: 'rose', palette: {} },
            aboutTitle: 'Sobre o studio',
            aboutParagraphs: ['Primeiro parágrafo'],
            whatsappNumber: '5511987654321',
            instagramHandle: 'studioe2e',
        };

        it('GET /site/brand é público', () => {
            return request(app.getHttpServer()).get('/site/brand').expect(200);
        });

        it('PUT /site/brand exige admin', () => {
            return request(app.getHttpServer())
                .put('/site/brand')
                .set('Authorization', `Bearer ${professionalToken}`)
                .send(brandPayload)
                .expect(401);
        });

        it('admin atualiza e lê a marca', async () => {
            await request(app.getHttpServer())
                .put('/site/brand')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(brandPayload)
                .expect(200)
                .expect((res) => {
                    const body = res.body as typeof brandPayload;
                    expect(body.name).toBe(brandPayload.name);
                    expect(body.theme.preset).toBe('rose');
                    expect(body.aboutParagraphs).toEqual(
                        brandPayload.aboutParagraphs,
                    );
                });
            const stored = await SiteBrand.findOne();
            createdBrandId = stored?.id ?? null;

            await request(app.getHttpServer())
                .get('/site/brand')
                .expect(200)
                .expect((res) => {
                    const body = res.body as typeof brandPayload;
                    expect(body.whatsappNumber).toBe(
                        brandPayload.whatsappNumber,
                    );
                });
        });

        it('GET /site/gallery é público', async () => {
            await request(app.getHttpServer())
                .get('/site/gallery')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });

        it('POST /site/gallery exige arquivo e admin', async () => {
            await request(app.getHttpServer())
                .post('/site/gallery')
                .set('Authorization', `Bearer ${professionalToken}`)
                .attach('file', Buffer.from('fake'), {
                    filename: 'teste.png',
                    contentType: 'image/png',
                })
                .expect(401);

            await request(app.getHttpServer())
                .post('/site/gallery')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('admin adiciona, edita e remove imagem da galeria', async () => {
            const created = await request(app.getHttpServer())
                .post('/site/gallery')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.from('fake-image'), {
                    filename: 'teste.png',
                    contentType: 'image/png',
                })
                .field('title', 'Antes e depois')
                .expect(201);
            const image = created.body as {
                id: number;
                url: string;
                title?: string;
            };
            createdGalleryIds.push(image.id);
            expect(image.url).toContain('data:image/png;base64,');
            expect(image.title).toBe('Antes e depois');

            await request(app.getHttpServer())
                .patch(`/site/gallery/${image.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Nova legenda' })
                .expect(200)
                .expect((res) => {
                    expect((res.body as { title?: string }).title).toBe(
                        'Nova legenda',
                    );
                });

            await request(app.getHttpServer())
                .delete(`/site/gallery/${image.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });
    });

    describe('Agenda', () => {
        function nextMonday(): string {
            const date = new Date();
            const offset = (8 - date.getUTCDay()) % 7 || 7;
            date.setUTCDate(date.getUTCDate() + offset);
            return date.toISOString().slice(0, 10);
        }

        it('admin cadastra procedimento, disponibilidade e cliente agenda', async () => {
            const general = await Category.findOne({
                where: { name: 'Geral' },
            });
            const procedure = await request(app.getHttpServer())
                .post('/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    category_id: general!.id,
                    professional_ids: [professional.professional.id],
                    name: 'E2E Procedure',
                    description: 'Procedimento de teste',
                    duration_minutes: 30,
                    price: 100,
                    sessions: 1,
                    triagem: false,
                    triagem_minutes: 0,
                })
                .expect(201);
            const procedureId = (procedure.body as { id: number }).id;
            createdProcedureIds.push(procedureId);

            await request(app.getHttpServer())
                .post('/work-schedules')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    professional_id: professional.professional.id,
                    days_of_week: [1],
                    start_time: '09:00',
                    end_time: '18:00',
                })
                .expect(201);

            const date = nextMonday();
            const schedule = await request(app.getHttpServer())
                .post('/schedules')
                .set('Authorization', `Bearer ${clientToken}`)
                .send({
                    procedure_id: procedureId,
                    professional_id: professional.professional.id,
                    client_id: testClient.client.id,
                    date,
                    start_time: '09:00',
                    session: 1,
                })
                .expect(201);

            const scheduleId = (schedule.body as { id: number }).id;
            expect(scheduleId).toBeGreaterThan(0);

            await request(app.getHttpServer())
                .get(`/schedules?client_id=${testClient.client.id}`)
                .set('Authorization', `Bearer ${clientToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as {
                        total?: number;
                        data?: {
                            client_id: number;
                            client?: { name?: string; phone_number?: string };
                            professional?: {
                                name?: string;
                                phone_number?: string;
                            };
                        }[];
                    };
                    expect(body.total).toBeGreaterThan(0);
                    expect(body.data?.length).toBeGreaterThan(0);
                    expect(
                        body.data?.every(
                            (entry) => entry.client_id === testClient.client.id,
                        ),
                    ).toBe(true);
                    expect(body.data?.[0]?.client?.name).toBe(
                        testClient.user.name,
                    );
                    expect(body.data?.[0]?.client?.phone_number).toBe(
                        testClient.user.phone_number,
                    );
                    expect(body.data?.[0]?.professional?.name).toBe(
                        professional.user.name,
                    );
                    expect(body.data?.[0]?.professional?.phone_number).toBe(
                        professional.user.phone_number,
                    );
                });

            await request(app.getHttpServer())
                .get(`/schedules?client_id=${testClient.client.id + 999}`)
                .set('Authorization', `Bearer ${clientToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as {
                        data?: { client_id: number }[];
                    };
                    expect(
                        body.data?.every(
                            (entry) => entry.client_id === testClient.client.id,
                        ),
                    ).toBe(true);
                });
        });

        it('profissional vê somente os próprios agendamentos', async () => {
            await request(app.getHttpServer())
                .get('/schedules')
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as {
                        data?: { professional_id: number }[];
                    };
                    expect(body.data?.length).toBeGreaterThan(0);
                    expect(
                        body.data?.every(
                            (schedule) =>
                                schedule.professional_id ===
                                professional.professional.id,
                        ),
                    ).toBe(true);
                });
        });

        it('profissional lista seus clientes e histórico filtrado', async () => {
            await request(app.getHttpServer())
                .get('/schedules/my-clients')
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as {
                        clientId: number;
                        name: string;
                    }[];
                    expect(
                        body.some(
                            (client) =>
                                client.clientId === testClient.client.id,
                        ),
                    ).toBe(true);
                });

            await request(app.getHttpServer())
                .get(`/schedules/my-clients/${testClient.client.id}/history`)
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as {
                        client_id: number;
                        professional_id: number;
                    }[];
                    expect(body.length).toBeGreaterThan(0);
                    expect(
                        body.every(
                            (schedule) =>
                                schedule.client_id === testClient.client.id &&
                                schedule.professional_id ===
                                    professional.professional.id,
                        ),
                    ).toBe(true);
                });
        });

        it('cliente não acessa lista de clientes do profissional', () => {
            return request(app.getHttpServer())
                .get('/schedules/my-clients')
                .set('Authorization', `Bearer ${clientToken}`)
                .expect(401);
        });

        it('exceção de agenda aceita e retorna nome', async () => {
            const date = '2031-01-01';
            const created = await request(app.getHttpServer())
                .post('/schedule-exceptions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    professional_id: professional.professional.id,
                    date,
                    type: 'open',
                    name: 'Feriado',
                })
                .expect(201);
            const id = (created.body as { id: number }).id;
            createdExceptionIds.push(id);

            await request(app.getHttpServer())
                .get(
                    `/schedule-exceptions?professional_id=${professional.professional.id}&date=${date}`,
                )
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as {
                        data?: { id: number; name?: string }[];
                    };
                    expect(
                        body.data?.find((entry) => entry.id === id)?.name,
                    ).toBe('Feriado');
                });

            await request(app.getHttpServer())
                .patch(`/schedule-exceptions/${id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Feriado Atualizado' })
                .expect(200);

            await request(app.getHttpServer())
                .get(
                    `/schedule-exceptions?professional_id=${professional.professional.id}&date=${date}`,
                )
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as {
                        data?: { id: number; name?: string }[];
                    };
                    expect(
                        body.data?.find((entry) => entry.id === id)?.name,
                    ).toBe('Feriado Atualizado');
                });

            await request(app.getHttpServer())
                .delete(`/schedule-exceptions/${id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });
    });

    describe('Logout', () => {
        it('invalida a sessão atual', async () => {
            await request(app.getHttpServer())
                .post('/auth/logout')
                .set('Authorization', `Bearer ${clientToken}`)
                .expect(201);

            await request(app.getHttpServer())
                .get(`/users/${testClient.user.id}`)
                .set('Authorization', `Bearer ${clientToken}`)
                .expect(401);
        });
    });

    it('POST /auth/recovery/request-email-code retorna 404 para e-mail não cadastrado', () => {
        return request(app.getHttpServer())
            .post('/auth/recovery/request-email-code')
            .send({ email: 'nao-existe@example.com' })
            .expect(404)
            .expect((res) => {
                const body = res.body as { message: string };
                expect(body.message).toBe(
                    'Não encontramos uma conta com este e-mail',
                );
            });
    });

    it('cria cliente somente após confirmar e-mail e telefone', async () => {
        const suffix = String(Date.now()).slice(-8);
        const phone = `119${suffix}`;
        const email = `e2e-signup-${suffix}@example.com`;

        const requested = await request(app.getHttpServer())
            .post('/auth/signup/request-code')
            .send({ name: 'Signup Teste', phone_number: phone, email })
            .expect(201);
        const signupId = (requested.body as { signup_id: string }).signup_id;

        await expect(
            User.findOne({ where: { phone_number: phone } }),
        ).resolves.toBeNull();

        const emailCode = await redis.get(
            redisKey(siteId, 'signup', signupId, 'email'),
        );

        await request(app.getHttpServer())
            .post('/auth/signup/verify-email-code')
            .send({ signup_id: signupId, email_code: '000000' })
            .expect(401);

        await request(app.getHttpServer())
            .post('/auth/signup/verify-email-code')
            .send({ signup_id: signupId, email_code: emailCode })
            .expect(201);

        const phoneCode = await redis.get(
            redisKey(siteId, 'signup', signupId, 'phone'),
        );

        await expect(
            User.findOne({ where: { phone_number: phone } }),
        ).resolves.toBeNull();

        await request(app.getHttpServer())
            .post('/auth/signup/resend-phone-code')
            .send({ signup_id: signupId })
            .expect(201);
        const resentPhoneCode = await redis.get(
            redisKey(siteId, 'signup', signupId, 'phone'),
        );

        await request(app.getHttpServer())
            .post('/auth/signup/verify-phone-code')
            .send({ signup_id: signupId, phone_code: '000000' })
            .expect(401);

        await request(app.getHttpServer())
            .post('/auth/signup/verify-phone-code')
            .send({ signup_id: signupId, phone_code: resentPhoneCode })
            .expect(201);

        const user = await User.findOne({ where: { phone_number: phone } });
        expect(user).toMatchObject({
            phone_number_confirmed: true,
            email_confirmed: true,
        });
        const client = await Client.findOne({ where: { user_id: user!.id } });
        expect(client).not.toBeNull();
        createdClients.push({ user: user!, client: client! });
        expect(phoneCode).toBeTruthy();
    });

    it('confirma o telefone após o login', async () => {
        const loginUser = await createTestUser(false);
        await loginUser.user.update({ phone_number_confirmed: false });

        await request(app.getHttpServer())
            .post('/auth/request-code')
            .send({ phone_number: loginUser.user.phone_number })
            .expect(201);
        const code = await redis.get(
            redisKey(siteId, 'auth_code', loginUser.user.phone_number),
        );

        await request(app.getHttpServer())
            .post('/auth/verify-code')
            .send({
                phone_number: loginUser.user.phone_number,
                verification_code: code,
            })
            .expect(201);

        await loginUser.user.reload();
        expect(loginUser.user.phone_number_confirmed).toBe(true);
    });

    it('recupera o telefone em etapas de e-mail e novo número', async () => {
        const target = await createTestClient();
        const suffix = String(Date.now()).slice(-8);
        const newPhone = `117${suffix}`;

        const requested = await request(app.getHttpServer())
            .post('/auth/recovery/request-email-code')
            .send({ email: target.user.email })
            .expect(201);
        const recoveryId = (requested.body as { recovery_id: string })
            .recovery_id;

        const dataKey = redisKey(siteId, 'recovery', recoveryId, 'data');
        const emailCodeKey = redisKey(siteId, 'recovery', recoveryId, 'email');
        const phoneCodeKey = redisKey(siteId, 'recovery', recoveryId, 'phone');
        const emailCode = await redis.get(emailCodeKey);

        await request(app.getHttpServer())
            .post('/auth/recovery/verify-email-code')
            .send({ recovery_id: recoveryId, email_code: '000000' })
            .expect(401);

        await request(app.getHttpServer())
            .post('/auth/recovery/verify-email-code')
            .send({ recovery_id: recoveryId, email_code: emailCode })
            .expect(201);

        await request(app.getHttpServer())
            .post('/auth/recovery/request-phone-code')
            .send({
                recovery_id: recoveryId,
                phone_number: target.user.phone_number,
            })
            .expect(400);

        await request(app.getHttpServer())
            .post('/auth/recovery/request-phone-code')
            .send({
                recovery_id: recoveryId,
                phone_number: admin.user.phone_number,
            })
            .expect(400);

        await request(app.getHttpServer())
            .post('/auth/recovery/request-phone-code')
            .send({ recovery_id: recoveryId, phone_number: newPhone })
            .expect(201);
        const phoneCode = await redis.get(phoneCodeKey);
        const stored = await redis.get(dataKey);
        expect(stored).toContain(newPhone);

        await request(app.getHttpServer())
            .post('/auth/recovery/verify-phone-code')
            .send({
                recovery_id: recoveryId,
                phone_number: newPhone,
                phone_code: '000000',
            })
            .expect(401);

        await request(app.getHttpServer())
            .post('/auth/recovery/verify-phone-code')
            .send({
                recovery_id: recoveryId,
                phone_number: newPhone,
                phone_code: phoneCode,
            })
            .expect(201);

        await target.user.reload();
        expect(target.user).toMatchObject({
            phone_number: newPhone,
            phone_number_confirmed: true,
            email_confirmed: true,
        });
    });

    describe('Throttle de recuperação de conta', () => {
        it('bloqueia após 10 tentativas com 429', async () => {
            const email = `e2e-recovery-${Date.now()}@example.com`;

            for (let attempt = 0; attempt < 10; attempt++) {
                await request(app.getHttpServer())
                    .post('/auth/recovery/request-email-code')
                    .send({ email })
                    .expect(404);
            }

            await request(app.getHttpServer())
                .post('/auth/recovery/request-email-code')
                .send({ email })
                .expect(429);
        });
    });
});
