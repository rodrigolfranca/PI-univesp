import {
    plainToInstance,
    Transform,
    TransformFnParams,
    Type,
} from 'class-transformer';
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    MinLength,
    ValidateIf,
    validateSync,
} from 'class-validator';

function parseBoolean({ value }: TransformFnParams): unknown {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();

        if (['true', '1', 'yes', 'on'].includes(normalized)) {
            return true;
        }

        if (['false', '0', 'no', 'off'].includes(normalized)) {
            return false;
        }
    }

    return value;
}

export class EnvirontmentVariables {
    @IsNotEmpty()
    @IsString()
    NODE_ENV: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    PORT?: number;

    @IsNotEmpty()
    @IsString()
    DB_HOST: string;

    @Type(() => Number)
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

    @IsOptional()
    @Transform(parseBoolean)
    @IsBoolean()
    DB_SSL?: boolean;

    @IsOptional()
    @IsString()
    DB_SSL_CA_BASE64?: string;

    @IsOptional()
    @Transform(parseBoolean)
    @IsBoolean()
    DB_SYNC?: boolean;

    @IsOptional()
    @IsString()
    REDIS_URL?: string;

    @ValidateIf((config: { REDIS_URL?: string }) => !config.REDIS_URL)
    @IsNotEmpty()
    @IsString()
    REDIS_HOST?: string;

    @ValidateIf((config: { REDIS_URL?: string }) => !config.REDIS_URL)
    @Type(() => Number)
    @IsNotEmpty()
    @IsNumber()
    REDIS_PORT?: number;

    @IsOptional()
    @IsString()
    REDIS_PASSWORD?: string;

    @IsOptional()
    @Transform(parseBoolean)
    @IsBoolean()
    REDIS_TLS?: boolean;

    @IsOptional()
    @IsString()
    CORS_ORIGINS?: string;

    @IsOptional()
    @IsString()
    TRUST_PROXY?: string;

    @ValidateIf((config: { NODE_ENV?: string }) =>
        ['production', 'prod'].includes(
            String(config.NODE_ENV).toLowerCase(),
        ),
    )
    @IsNotEmpty()
    @IsString()
    SITE_ID?: string;

    @IsOptional()
    @IsString()
    UPSTASH_REDIS_REST_URL?: string;

    @IsOptional()
    @IsString()
    UPSTASH_REDIS_REST_TOKEN?: string;

    @IsOptional()
    @IsString()
    SUPABASE_URL?: string;

    @IsOptional()
    @IsString()
    SUPABASE_SERVICE_ROLE_KEY?: string;

    @IsOptional()
    @IsString()
    SUPABASE_STORAGE_BUCKET?: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(64, {
        message: 'JWT_SECRET deve ter pelo menos 64 caracteres',
    })
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

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    AUTH_THROTTLE_TTL_MS?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    AUTH_THROTTLE_LIMIT?: number;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(EnvirontmentVariables, config);

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
