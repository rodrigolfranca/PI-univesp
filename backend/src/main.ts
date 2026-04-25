import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { CoreModule } from './common/core/core.module';
import { swaggerConfig } from './common/swagger/config';

async function bootstrap() {
    const app = await NestFactory.create(CoreModule);
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );
    SwaggerModule.setup('documentation', app, SwaggerModule.createDocument(app, swaggerConfig));
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
