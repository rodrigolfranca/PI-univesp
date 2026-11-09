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
    Query,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiProduces,
    ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminGuard, AuthGuard } from '../auth/guards';
import { PopsService } from './pops.service';
import { PopsCreateDTO } from './validation/pops-create.dto';
import { PopsListDTO } from './validation/pops-list.dto';
import { PopsUpdateDTO } from './validation/pops-update.dto';

const PDF_MAX_SIZE = Math.floor(4.5 * 1024 * 1024);
const pdfUploadOptions = {
    limits: { fileSize: PDF_MAX_SIZE },
    fileFilter: (
        _request: unknown,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
        if (
            !['application/pdf', 'application/octet-stream'].includes(
                file.mimetype,
            )
        ) {
            callback(new BadRequestException('Envie um arquivo PDF'), false);
            return;
        }
        callback(null, true);
    },
};

@ApiTags('POPs')
@Controller('pops')
export class PopsController {
    constructor(private readonly popsService: PopsService) {}

    @UseGuards(AuthGuard, AdminGuard)
    @Post()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cria uma nova POP' })
    @UseInterceptors(FileInterceptor('file', pdfUploadOptions))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                procedure_id: { type: 'integer' },
                name: { type: 'string' },
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async create(
        @Body() body: PopsCreateDTO,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.popsService.createPop(body, file);
    }

    @Get()
    @ApiOperation({ summary: 'Lista as POPs' })
    async list(@Query() query: PopsListDTO) {
        return this.popsService.list(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtém uma POP por ID' })
    async get(@Param('id', ParseIntPipe) id: number) {
        return this.popsService.getById(id);
    }

    @Get(':id/download')
    @ApiOperation({ summary: 'Baixa o PDF de uma POP' })
    @ApiProduces('application/pdf')
    async download(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response,
    ) {
        const pop = await this.popsService.getFileBuffer(id);
        const baseName = pop.name
            .replace(/\.pdf$/i, '')
            .replace(/[^\w.-]+/g, '_');

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${baseName || 'pop'}.pdf"`,
        });
        res.send(pop.content);
    }

    @UseGuards(AuthGuard, AdminGuard)
    @Patch(':id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Atualiza uma POP' })
    @UseInterceptors(FileInterceptor('file', pdfUploadOptions))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                procedure_id: { type: 'integer' },
                name: { type: 'string' },
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: PopsUpdateDTO,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.popsService.update(id, body, file);
    }

    @UseGuards(AuthGuard, AdminGuard)
    @Delete(':id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Remove uma POP' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.popsService.delete(id);
    }
}
