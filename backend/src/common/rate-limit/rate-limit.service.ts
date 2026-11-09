import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis as UpstashRedis } from '@upstash/redis';

interface LimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
}

@Injectable()
export class RateLimitService {
    private readonly logger = new Logger(RateLimitService.name);
    private readonly siteId: string;
    private readonly upstashRedis?: UpstashRedis;
    private readonly limiters = new Map<string, Ratelimit>();
    private readonly memory = new Map<
        string,
        { count: number; expiresAt: number }
    >();
    private fallbackWarned = false;

    constructor(private readonly configService: ConfigService) {
        this.siteId = configService.get<string>('SITE_ID') || 'site';
        const url = configService.get<string>('UPSTASH_REDIS_REST_URL');
        const token = configService.get<string>('UPSTASH_REDIS_REST_TOKEN');

        if (url && token) {
            this.upstashRedis = new UpstashRedis({ url, token });
        }
    }

    get authLimit(): number {
        return this.configService.get<number>('AUTH_THROTTLE_LIMIT') ?? 10;
    }

    get authWindowMs(): number {
        return this.configService.get<number>('AUTH_THROTTLE_TTL_MS') ?? 60000;
    }

    async consume(
        bucket: string,
        subject: string,
        limit: number,
        windowMs: number,
    ): Promise<LimitResult> {
        const key = `${bucket}:${subject}`;

        if (this.upstashRedis) {
            try {
                const limiter = this.getLimiter(limit, windowMs);
                const result = await limiter.limit(key);
                return {
                    success: result.success,
                    remaining: result.remaining,
                    resetAt: result.reset,
                };
            } catch (error) {
                if (!this.fallbackWarned) {
                    this.fallbackWarned = true;
                    this.logger.warn(
                        `Upstash Ratelimit indisponível; usando fallback em memória: ${
                            error instanceof Error ? error.message : error
                        }`,
                    );
                }
            }
        }

        return this.consumeMemory(key, limit, windowMs);
    }

    private getLimiter(limit: number, windowMs: number): Ratelimit {
        const cacheKey = `${limit}:${windowMs}`;
        const cached = this.limiters.get(cacheKey);
        if (cached) return cached;

        const limiter = new Ratelimit({
            redis: this.upstashRedis!,
            limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
            prefix: `${this.siteId}:ratelimit`,
            analytics: false,
            timeout: 1500,
        });
        this.limiters.set(cacheKey, limiter);
        return limiter;
    }

    private consumeMemory(
        key: string,
        limit: number,
        windowMs: number,
    ): LimitResult {
        const now = Date.now();
        if (this.memory.size > 5000) this.evictExpired(now);

        const current = this.memory.get(key);
        if (!current || current.expiresAt <= now) {
            const expiresAt = now + windowMs;
            this.memory.set(key, { count: 1, expiresAt });
            return { success: true, remaining: limit - 1, resetAt: expiresAt };
        }

        current.count += 1;
        return {
            success: current.count <= limit,
            remaining: Math.max(0, limit - current.count),
            resetAt: current.expiresAt,
        };
    }

    private evictExpired(now: number) {
        for (const [key, value] of this.memory) {
            if (value.expiresAt <= now) this.memory.delete(key);
        }
    }
}
