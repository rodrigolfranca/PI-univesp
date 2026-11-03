import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// Padrão e ja existe no node
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

@Injectable()
export class CryptoService {
    private readonly encryptionKey: Buffer;

    constructor(private readonly configService: ConfigService) {
        this.encryptionKey = Buffer.from(
            this.configService.getOrThrow<string>(
                'GOOGLE_TOKEN_ENCRYPTION_KEY',
            ),
            'hex',
        );
    }

    generateCode(length: number = 6): string {
        return crypto
            .randomInt(0, 10 ** length)
            .toString()
            .padStart(length, '0');
    }

    encrypt(plainText: string): string {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(
            ENCRYPTION_ALGORITHM,
            this.encryptionKey,
            iv,
        );
        const encrypted = Buffer.concat([
            cipher.update(plainText, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();

        return [iv, authTag, encrypted]
            .map((part) => part.toString('base64'))
            .join(':');
    }

    decrypt(encryptedText: string): string {
        const [iv, authTag, encrypted] = encryptedText
            .split(':')
            .map((part) => Buffer.from(part, 'base64'));
        const decipher = crypto.createDecipheriv(
            ENCRYPTION_ALGORITHM,
            this.encryptionKey,
            iv,
        );
        decipher.setAuthTag(authTag);

        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]).toString('utf8');
    }
}
