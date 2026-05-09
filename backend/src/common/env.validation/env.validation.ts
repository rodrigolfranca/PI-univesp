import { Transform } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsNumberString,
    IsString,
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
    @IsNumberString()
    @Transform(({ value }) => parseInt(String(value), 10))
    @IsNumber()
    REDIS_PORT: number;

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
