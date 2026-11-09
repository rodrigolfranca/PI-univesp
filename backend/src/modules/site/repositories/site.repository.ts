import { Injectable } from '@nestjs/common';
import { GalleryImage, SiteBrand } from 'src/common/models';

@Injectable()
export class SiteRepository {
    findBrand(): Promise<SiteBrand | null> {
        return SiteBrand.findOne({ order: [['id', 'ASC']] });
    }

    createBrand(values: Partial<SiteBrand>): Promise<SiteBrand> {
        return SiteBrand.create(values);
    }

    saveBrand(brand: SiteBrand): Promise<SiteBrand> {
        return brand.save();
    }

    listGallery(): Promise<GalleryImage[]> {
        return GalleryImage.findAll({
            order: [
                ['sort_order', 'ASC'],
                ['id', 'ASC'],
            ],
        });
    }

    findGalleryImage(id: number): Promise<GalleryImage | null> {
        return GalleryImage.findByPk(id);
    }

    nextGallerySortOrder(): Promise<number> {
        return GalleryImage.max('sort_order').then((value) =>
            Number.isFinite(value) ? Number(value) + 1 : 0,
        );
    }

    createGalleryImage(
        values: Partial<GalleryImage>,
    ): Promise<GalleryImage> {
        return GalleryImage.create(values);
    }

    saveGalleryImage(image: GalleryImage): Promise<GalleryImage> {
        return image.save();
    }

    async removeGalleryImage(image: GalleryImage): Promise<void> {
        await image.destroy();
    }
}
