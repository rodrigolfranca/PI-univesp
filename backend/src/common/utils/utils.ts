import { HttpException, InternalServerErrorException } from '@nestjs/common';

export class Utils {
    static handleError(error: unknown): never {
        if (error instanceof HttpException) {
            throw error;
        }
        throw new InternalServerErrorException('An unexpected error occurred');
    }
}
