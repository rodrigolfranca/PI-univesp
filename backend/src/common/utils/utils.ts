import {
    HttpException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';

export class Utils {
    static handleError(error: unknown): never {
        if (error instanceof HttpException) {
            throw error;
        }
        throw new InternalServerErrorException('An unexpected error occurred');
    }

    static logError(logger: Logger, message: string, error: unknown): void {
        if (error instanceof HttpException && error.getStatus() < 500) {
            logger.warn(`${message}: ${error.message}`);
            return;
        }
        logger.error(
            `${message}: ${String(error)}`,
            error instanceof Error ? error.stack : undefined,
        );
    }
}
