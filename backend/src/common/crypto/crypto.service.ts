import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
    generateCode(length: number = 6): string {
        return crypto
            .randomInt(0, 10 ** length)
            .toString()
            .padStart(length, '0');
    }
}
