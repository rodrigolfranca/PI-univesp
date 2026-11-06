import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SwaggerModule } from '@nestjs/swagger';
import { Sequelize } from 'sequelize-typescript';
import { CoreModule } from '../../src/common/core/core.module';
import { swaggerConfig } from '../../src/common/swagger/config';

export async function createE2EApp(): Promise<INestApplication> {
    const moduleFixture = await Test.createTestingModule({
        imports: [CoreModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('documentation', app, document);

    await app.init();
    return app;
}

export async function closeE2EApp(app: INestApplication): Promise<void> {
    const sequelize = app.get<Sequelize>('DATABASE_PROVIDER');
    await app.close();
    await sequelize.close();
}
