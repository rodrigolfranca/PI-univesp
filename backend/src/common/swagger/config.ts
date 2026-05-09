import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
    .setTitle('API de Agendamento de Serviços')
    .setDescription('API para agendamento de serviços, incluindo gerenciamento de usuários, serviços e agendamentos.')
    .setVersion('1.0')
    .addBearerAuth(
        {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Insira o token JWT no formato: Bearer <JWT>',
        },
        'JWT-auth',
    )
    .build();
