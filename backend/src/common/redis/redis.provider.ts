import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

const logger = new Logger("RedisProvider");

export const RedisProvider = {
    provide: "REDIS_CLIENT",
    inject: [ConfigService],
    useFactory: (configService: ConfigService): Promise<Redis> => {
        return new Promise((resolve, reject) => {
            const redis = new Redis({
                host: configService.getOrThrow<string>("REDIS_HOST"),
                port: parseInt(configService.getOrThrow<string>("REDIS_PORT"), 10),
            });

            redis.on("connect", () => {
                logger.log("Redis connection established");
                resolve(redis);
            });

            redis.on("error", (err) => {
                logger.error("Redis connection error", err);
                reject(err);
            });
        });
    },
};
