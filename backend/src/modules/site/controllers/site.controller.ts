import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard, AuthGuard } from 'src/modules/auth/guards';
import { SiteService } from '../services/site.service';
import { BrandUpdateDTO } from '../validation/brand-update.dto';
import { GalleryUpdateDTO } from '../validation/gallery-update.dto';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function imageUpload(maxSize: number) {
    return {
        limits: { fileSize: maxSize },
        fileFilter: (
            _request: unknown,
            file: Express.Multer.File,
            callback: (error: Error | null, acceptFile: boolean) => void,
        ) => {
            if (!IMAGE_TYPES.has(file.mimetype)) {
                callback(
                    new BadRequestException(
                        'Envie uma imagem PNG, JPG ou WebP',
                    ),
                    false,
                );
                return;
            }
            callback(null, true);
        },
    };
}

@ApiTags('Site')
@Controller('site')
export class SiteController {
    constructor(private readonly siteService: SiteService) {}

    @Get('brand')
    @ApiOperation({ summary: 'Obtém a identidade visual do site' })
    async getBrand() {
        return this.siteService.getBrand();
    }

    @Put('brand')
    @UseGuards(AuthGuard, AdminGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Atualiza a identidade visual do site' })
    async updateBrand(@Body() dto: BrandUpdateDTO) {
        return this.siteService.updateBrand(dto);
    }

    @Post('brand/logo')
    @UseGuards(AuthGuard, AdminGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Envia o logo do site' })
    @UseInterceptors(FileInterceptor('file', imageUpload(2 * 1024 * 1024)))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    async uploadLogo(@UploadedFile() file: Express.Multer.File) {
        return this.siteService.uploadLogo(file);
    }

    @Get('gallery')
    @ApiOperation({ summary: 'Lista as imagens da galeria' })
    async listGallery() {
        return this.siteService.listGallery();
    }

    @Post('gallery')
    @UseGuards(AuthGuard, AdminGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Adiciona uma imagem à galeria' })
    @UseInterceptors(FileInterceptor('file', imageUpload(4 * 1024 * 1024)))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                title: { type: 'string' },
            },
        },
    })
    async addGallery(
        @UploadedFile() file: Express.Multer.File,
        @Body('title') title?: string,
    ) {
        return this.siteService.addGalleryImage(file, title);
    }

    @Patch('gallery/:id')
    @UseGuards(AuthGuard, AdminGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Atualiza a legenda de uma imagem' })
    async updateGallery(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: GalleryUpdateDTO,
    ) {
        return this.siteService.updateGalleryImage(id, dto);
    }

    @Delete('gallery/:id')
    @UseGuards(AuthGuard, AdminGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Remove uma imagem da galeria' })
    async deleteGallery(@Param('id', ParseIntPipe) id: number) {
        return this.siteService.deleteGalleryImage(id);
    }
}
