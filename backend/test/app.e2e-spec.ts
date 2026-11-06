import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { closeE2EApp, createE2EApp } from './utils/create-e2e-app';

describe('API (e2e)', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
        app = (await createE2EApp()) as INestApplication<App>;
    });

    afterAll(async () => {
        await closeE2EApp(app);
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
});
