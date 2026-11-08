import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import request from 'supertest';
import { App } from 'supertest/types';
import {
    Category,
    Client,
    Procedure,
    Professional,
    Schedule,
    ScheduleException,
    User,
    WorkSchedule,
} from 'src/common/models';
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

        admin = await createTestUser(true);
        professional = await createTestUser(false);
        adminToken = await jwtService.signAsync({
            keyType: 'access',
            id: admin.user.id,
        });
        professionalToken = await jwtService.signAsync({
            keyType: 'access',
            id: professional.user.id,
        });
        testClient = await createTestClient();
        clientToken = await jwtService.signAsync({
            keyType: 'access',
            id: testClient.user.id,
        });
    });

    afterAll(async () => {
        try {
            if (professional) {
                await Schedule.destroy({
                    where: { professional_id: professional.professional.id },
                    force: true,
                });
                await WorkSchedule.destroy({
                    where: { professional_id: professional.professional.id },
                    force: true,
                });
            }
            for (const id of createdProcedureIds) {
                await Procedure.destroy({ where: { id }, force: true });
            }
            for (const id of createdExceptionIds) {
                await ScheduleException.destroy({ where: { id }, force: true });
            }
            for (const id of createdCategoryIds) {
                await Category.destroy({ where: { id }, force: true });
            }
            for (const { user, professional } of createdUsers) {
                await redis.del(`user:${user.id}`);
                await Professional.destroy({
                    where: { id: professional.id },
                    force: true,
                });
                await User.destroy({ where: { id: user.id }, force: true });
            }
            for (const { user, client } of createdClients) {
                await redis.del(`user:${user.id}`);
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
        it('profissional consulta por telefone', () => {
            return request(app.getHttpServer())
                .get(
                    `/users/by-phone?phone_number=${professional.user.phone_number}`,
                )
                .set('Authorization', `Bearer ${professionalToken}`)
                .expect(200)
                .expect((res) => {
                    const body = res.body as { id?: number };
                    expect(body.id).toBe(professional.user.id);
                });
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
                `contact_change:${testClient.user.id}:phone`,
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

    describe('Agenda', () => {
        function nextMonday(): string {
            const date = new Date();
            const offset = (8 - date.getUTCDay()) % 7 || 7;
            date.setUTCDate(date.getUTCDate() + offset);
            return date.toISOString().slice(0, 10);
        }

        it('admin cadastra procedimento, disponibilidade e cliente agenda', async () => {
            const procedure = await request(app.getHttpServer())
                .post('/procedures')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
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

    describe('Throttle de recuperação de conta', () => {
        it('bloqueia após 10 tentativas com 429', async () => {
            const email = `e2e-recovery-${Date.now()}@example.com`;

            for (let attempt = 0; attempt < 10; attempt++) {
                await request(app.getHttpServer())
                    .post('/auth/recovery/request-code')
                    .send({ email })
                    .expect(201);
            }

            await request(app.getHttpServer())
                .post('/auth/recovery/request-code')
                .send({ email })
                .expect(429);
        });
    });
});
