import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { CoreModule } from './common/core/core.module';
import { requestLogger } from './common/middlewares/request-logger.middleware';
import { swaggerConfig } from './common/swagger/config';

const logger = new Logger('Bootstrap');

async function bootstrap() {
    const app = await NestFactory.create(CoreModule);
    const configService = app.get(ConfigService);
    const corsOrigins = configService.get<string>('CORS_ORIGINS');

    if (corsOrigins) {
        const origins = corsOrigins
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);

        if (origins.length > 0) {
            app.enableCors({
                origin:
                    origins.length === 1 && origins[0] === '*' ? true : origins,
                methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
                exposedHeaders: ['Content-Disposition'],
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
