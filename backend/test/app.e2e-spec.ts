import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import request from 'supertest';
import { App } from 'supertest/types';
import { Professional, User } from 'src/common/models';
import { closeE2EApp, createE2EApp } from './utils/create-e2e-app';

type TestUser = {
    user: User;
    professional: Professional;
};

describe('API (e2e)', () => {
    let app: INestApplication<App>;
    let redis: Redis;
    let admin: TestUser;
    let professional: TestUser;
    let adminToken: string;
    let professionalToken: string;
    const createdUsers: TestUser[] = [];

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
    });

    afterAll(async () => {
        try {
            for (const { user, professional } of createdUsers) {
                await redis.del(`user:${user.id}`);
                await Professional.destroy({
                    where: { id: professional.id },
                    force: true,
                });
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
