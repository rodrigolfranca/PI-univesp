import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_METADATA = 'rate_limit_options';

export type RateLimitKey = 'ip' | 'identity' | 'user';

export interface RateLimitOptions {
    bucket: string;
    key?: RateLimitKey;
    limit?: number;
    windowMs?: number;
}

export const RateLimit = (options: RateLimitOptions) =>
    SetMetadata(RATE_LIMIT_METADATA, options);
