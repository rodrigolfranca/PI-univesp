import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { GalleryImage, SiteBrand } from '../../../common/models';
import { SiteRepository } from '../repositories/site.repository';
import { BrandUpdateDTO } from '../validation/brand-update.dto';
import { GalleryUpdateDTO } from '../validation/gallery-update.dto';
import { SiteStorageService } from './site-storage.service';

export interface BrandResponse {
    name: string;
    logoUrl: string | null;
    theme: { preset: string; palette: Record<string, string> };
    aboutTitle: string;
    aboutParagraphs: string[];
    whatsappNumber: string;
    instagramHandle: string;
}

export interface GalleryResponse {
    id: number;
    url: string;
    title?: string;
}

@Injectable()
export class SiteService {
    constructor(
        private readonly siteRepository: SiteRepository,
        private readonly storage: SiteStorageService,
    ) {}

    async getBrand(): Promise<BrandResponse | null> {
        const brand = await this.siteRepository.findBrand();
        return brand ? this.toBrandResponse(brand) : null;
    }

    async updateBrand(dto: BrandUpdateDTO): Promise<BrandResponse> {
        const current = await this.siteRepository.findBrand();
        const values = {
            name: dto.name,
            logo_url: dto.logoUrl ?? null,
            theme_preset: dto.theme.preset,
            theme_palette: dto.theme.palette ?? {},
            about_title: dto.aboutTitle,
            about_paragraphs: dto.aboutParagraphs,
            whatsapp_number: dto.whatsappNumber,
            instagram_handle: dto.instagramHandle,
        };
        const brand =
            current ??
            (await this.siteRepository.createBrand(values));
        if (current) {
            current.set(values);
            await this.siteRepository.saveBrand(current);
        }
        return this.toBrandResponse(brand);
    }

    async uploadLogo(file: Express.Multer.File) {
        this.validateImage(file);
        return this.storage.upload(file, 'brand');
    }

    async listGallery(): Promise<GalleryResponse[]> {
        const images = await this.siteRepository.listGallery();
        return images.map((image) => this.toGalleryResponse(image));
    }

    async addGalleryImage(
        file: Express.Multer.File,
        title?: string,
    ): Promise<GalleryResponse> {
        this.validateImage(file);
        const stored = await this.storage.upload(file, 'gallery');
        const image = await this.siteRepository.createGalleryImage({
            url: stored.url,
            storage_path: stored.path,
            title: title?.trim() || null,
            sort_order: await this.siteRepository.nextGallerySortOrder(),
        });
        return this.toGalleryResponse(image);
    }

    async updateGalleryImage(
        id: number,
        dto: GalleryUpdateDTO,
    ): Promise<GalleryResponse> {
        const image = await this.siteRepository.findGalleryImage(id);
        if (!image) throw new NotFoundException('Image not found');
        image.title = dto.title?.trim() || null;
        await this.siteRepository.saveGalleryImage(image);
        return this.toGalleryResponse(image);
    }

    async deleteGalleryImage(id: number): Promise<{ message: string }> {
        const image = await this.siteRepository.findGalleryImage(id);
        if (!image) throw new NotFoundException('Image not found');
        await this.storage.remove(image.storage_path);
        await this.siteRepository.removeGalleryImage(image);
        return { message: 'Image deleted' };
    }

    private validateImage(file?: Express.Multer.File): void {
        if (!file?.buffer?.length) {
            throw new BadRequestException('File is required');
        }
    }

    private toBrandResponse(brand: SiteBrand): BrandResponse {
        return {
            name: brand.name,
            logoUrl: brand.logo_url,
            theme: {
                preset: brand.theme_preset,
                palette: brand.theme_palette ?? {},
            },
            aboutTitle: brand.about_title,
            aboutParagraphs: brand.about_paragraphs ?? [],
            whatsappNumber: brand.whatsapp_number,
            instagramHandle: brand.instagram_handle,
        };
    }

    private toGalleryResponse(image: GalleryImage): GalleryResponse {
        return {
            id: image.id,
            url: image.url,
            ...(image.title ? { title: image.title } : {}),
        };
    }
}
