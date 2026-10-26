import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

export function requestLogger(
    request: Request,
    response: Response,
    next: NextFunction,
) {
    const start = Date.now();

    response.on('finish', () => {
        const path = request.originalUrl.split('?')[0];
        const message = `${request.method} ${path} ${response.statusCode} ${Date.now() - start}ms`;

        if (response.statusCode >= 500) logger.error(message);
        else if (response.statusCode >= 400) logger.warn(message);
        else logger.log(message);
    });

    next();
}
