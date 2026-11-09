import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { CoreModule } from './common/core/core.module';
import { requestLogger } from './common/middlewares/request-logger.middleware';
import { swaggerConfig } from './common/swagger/config';

const logger = new Logger('Bootstrap');

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(CoreModule);
    const configService = app.get(ConfigService);
    const corsOrigins = configService.get<string>('CORS_ORIGINS');
    const isProduction = ['production', 'prod'].includes(
        String(configService.get<string>('NODE_ENV')).toLowerCase(),
    );
    const trustProxy =
        configService.get<string>('TRUST_PROXY') ??
        (isProduction ? '1' : 'false');

    app.use(
        helmet({
            contentSecurityPolicy: false,
        }),
    );
    app.set(
        'trust proxy',
        trustProxy === 'true'
            ? true
            : trustProxy === 'false'
              ? false
              : Number(trustProxy) || 1,
    );

    if (corsOrigins) {
        const origins = corsOrigins
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);

        if (origins.includes('*')) {
            throw new Error('CORS_ORIGINS não pode conter *');
        }

        if (origins.length > 0) {
            app.enableCors({
                origin: origins,
                methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
                exposedHeaders: ['Content-Disposition', 'Retry-After'],
            });
        }
    }

    app.use(requestLogger);
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );
    app.enableShutdownHooks();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('documentation', app, document);
    await app.listen(configService.get<number>('PORT') ?? 3000);
}

bootstrap().catch((error: unknown) => {
    logger.error(
        'Failed to start application',
        error instanceof Error ? error.stack : String(error),
    );
    process.exit(1);
});
