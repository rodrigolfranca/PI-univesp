import { ConfigService } from '@nestjs/config';
import { RateLimitService } from './rate-limit.service';

function serviceWith(values: Record<string, unknown>) {
    return new RateLimitService({
        get: (key: string) => values[key],
    } as unknown as ConfigService);
}

describe('RateLimitService', () => {
    it('limita no fallback em memória e libera após a janela', () => {
        const service = serviceWith({
            SITE_ID: 'test',
            AUTH_THROTTLE_LIMIT: 2,
            AUTH_THROTTLE_TTL_MS: 1000,
        });

        expect(service.authLimit).toBe(2);
        expect(service.authWindowMs).toBe(1000);

        return service.consume('auth', 'user:1', 2, 20).then(async (first) => {
            expect(first.success).toBe(true);
            expect(
                (await service.consume('auth', 'user:1', 2, 20)).success,
            ).toBe(true);
            expect(
                (await service.consume('auth', 'user:1', 2, 20)).success,
            ).toBe(false);
            await new Promise((resolve) => setTimeout(resolve, 30));
            expect(
                (await service.consume('auth', 'user:1', 2, 20)).success,
            ).toBe(true);
        });
    });
});
