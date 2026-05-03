import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

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
    @IsString()
    REDIS_PORT: string;

    @IsNotEmpty()
    @IsString()
    JWT_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = new EnvirontmentVariables();

    for (const [key, value] of Object.entries(config)) {
        if (key in validatedConfig) {
            validatedConfig[key as keyof EnvirontmentVariables] =
                value as never;
        }
    }

    return validatedConfig;
}
