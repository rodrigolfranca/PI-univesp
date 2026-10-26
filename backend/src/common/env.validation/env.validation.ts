import { plainToInstance } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    validateSync,
} from 'class-validator';

export class EnvirontmentVariables {
    @IsNotEmpty()
    @IsString()
    NODE_ENV: string;

    @IsNotEmpty()
    @IsNumber()
    PORT: number;

    @IsNotEmpty()
    @IsString()
    DB_HOST: string;

    @IsNotEmpty()
    @IsNumber()
    DB_PORT: number;

    @IsNotEmpty()
    @IsString()
    DB_USERNAME: string;

    @IsNotEmpty()
    @IsString()
    DB_PASSWORD: string;

    @IsNotEmpty()
    @IsString()
    DB_NAME: string;

    @IsNotEmpty()
    @IsString()
    REDIS_HOST: string;

    @IsNotEmpty()
    @IsNumber()
    REDIS_PORT: number;

    @IsNotEmpty()
    @IsString()
    JWT_SECRET: string;

    @IsNotEmpty()
    @IsString()
    GOOGLE_CLIENT_ID: string;

    @IsNotEmpty()
    @IsString()
    GOOGLE_CLIENT_SECRET: string;

    @IsNotEmpty()
    @IsString()
    GOOGLE_REDIRECT_URI: string;

    @IsNotEmpty()
    @Matches(/^[0-9a-f]{64}$/i, {
        message:
            'GOOGLE_TOKEN_ENCRYPTION_KEY deve ter 64 caracteres hexadecimais (32 bytes)',
    })
    GOOGLE_TOKEN_ENCRYPTION_KEY: string;

    @IsOptional()
    @IsString()
    GOOGLE_CALENDAR_TIMEZONE: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(EnvirontmentVariables, config, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        const messages = errors.flatMap((error) =>
            Object.values(error.constraints ?? {}),
        );
        throw new Error(
            `Variáveis de ambiente inválidas:\n- ${messages.join('\n- ')}`,
        );
    }

    return validatedConfig;
}
