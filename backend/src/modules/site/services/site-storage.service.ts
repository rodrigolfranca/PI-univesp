import {
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

const MIME_EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

export interface StoredFile {
    url: string;
    path: string | null;
}

@Injectable()
export class SiteStorageService {
    constructor(private readonly configService: ConfigService) {}

    private get supabaseUrl() {
        return this.configService.get<string>('SUPABASE_URL')?.replace(/\/$/, '');
    }

    private get serviceRoleKey() {
        return this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    }

    private get bucket() {
        return this.configService.get<string>('SUPABASE_STORAGE_BUCKET');
    }

    private get siteId() {
        return this.configService.get<string>('SITE_ID') || 'site';
    }

    async upload(
        file: Express.Multer.File,
        folder: 'brand' | 'gallery',
    ): Promise<StoredFile> {
        if (!MIME_EXTENSIONS[file.mimetype]) {
            throw new InternalServerErrorException('Unsupported image type');
        }

        if (!this.supabaseUrl || !this.serviceRoleKey || !this.bucket) {
            return {
                url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                path: null,
            };
        }

        const extension = MIME_EXTENSIONS[file.mimetype];
        const path = `${this.siteId}/${folder}/${Date.now()}-${randomUUID()}.${extension}`;
        const response = await fetch(
            `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${path}`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.serviceRoleKey}`,
                    'Content-Type': file.mimetype,
                    'x-upsert': 'false',
                },
                body: new Uint8Array(file.buffer) as BodyInit,
                signal: AbortSignal.timeout(10000),
            },
        );

        if (!response.ok) {
            throw new InternalServerErrorException(
                'Falha ao enviar a imagem para o armazenamento',
            );
        }

        return {
            url: `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${path}`,
            path,
        };
    }

    async remove(path: string | null): Promise<void> {
        if (!path || !this.supabaseUrl || !this.serviceRoleKey || !this.bucket) {
            return;
        }

        const response = await fetch(
            `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${path}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${this.serviceRoleKey}`,
                },
                signal: AbortSignal.timeout(10000),
            },
        );

        if (!response.ok && response.status !== 404) {
            throw new InternalServerErrorException(
                'Falha ao remover a imagem do armazenamento',
            );
        }
    }
}
