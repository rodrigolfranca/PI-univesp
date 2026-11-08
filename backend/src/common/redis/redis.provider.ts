import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis, type RedisOptions } from 'ioredis';

const logger = new Logger('RedisProvider');

function parseBoolean(value: unknown): boolean | undefined {
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

    return undefined;
}

export const RedisProvider = {
    provide: 'REDIS_CLIENT',
    inject: [ConfigService],
    useFactory: (configService: ConfigService): Promise<Redis> => {
        const url = configService.get<string>('REDIS_URL');
        const password = configService.get<string>('REDIS_PASSWORD');
        const tls = parseBoolean(configService.get('REDIS_TLS')) ?? false;

        const options: RedisOptions = {
            connectTimeout: 10000,
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 200, 2000),
        };

        if (!url && password) {
            options.password = password;
        }

        if (!url && tls) {
            options.tls = {};
        }

        const redis = url
            ? new Redis(url, options)
            : new Redis({
                  ...options,
                  host: configService.getOrThrow<string>('REDIS_HOST'),
                  port: configService.getOrThrow<number>('REDIS_PORT'),
              });

        return new Promise((resolve, reject) => {
            let settled = false;

            redis.once('ready', () => {
                settled = true;
                logger.log('Redis connection established');
                resolve(redis);
            });

            redis.on('error', (err) => {
                logger.error('Redis connection error', err);

                if (!settled) {
                    settled = true;
                    reject(err);
                }
            });
        });
    },
};
