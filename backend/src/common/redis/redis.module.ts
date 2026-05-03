import { Inject, Module, OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";
import { RedisProvider } from "./redis.provider";

@Module({
    providers: [RedisProvider],
    exports: [RedisProvider],
})
export class RedisModule implements OnModuleDestroy {
    constructor(@Inject("REDIS_CLIENT") private readonly redis: Redis) { }

    async onModuleDestroy() {
        await this.redis.quit();
    }
}
