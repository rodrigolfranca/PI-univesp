import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Res,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
type ResponseType = Response;
import { PopsService } from './pops.service';
import { PopsCreateDTO } from './validation/pops-create.dto';
import { PopsListDTO } from './validation/pops-list.dto';
import { PopsUpdateDTO } from './validation/pops-update.dto';
import { AuthGuard, AdminGuard } from 'src/modules/auth/guards';

@ApiTags('POPs')
@Controller('pops')
export class PopsController {
    constructor(private readonly popsService: PopsService) {}

    @UseGuards(AuthGuard, AdminGuard)
    @Post()
    @UseInterceptors(FileInterceptor('file'))
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
    async list(@Query() query: PopsListDTO) {
        return this.popsService.list(query);
    }

    @Get(':id')
    async get(@Param('id', ParseIntPipe) id: number) {
        return this.popsService.getById(id);
    }

    @Get(':id/download')
    @ApiOperation({ summary: 'Download the PDF file for a specific POP' })
    async download(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: ResponseType,
    ) {
        const pop = await this.popsService.getFileBuffer(id);
        res.set({
            'Content-Type': pop.mime_type || 'application/pdf',
            'Content-Disposition': `attachment; filename="${pop.name}"`,
        });
        res.send(pop.base64);
    }

    @UseGuards(AuthGuard, AdminGuard)
    @Patch(':id')
    @UseInterceptors(FileInterceptor('file'))
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
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.popsService.delete(id);
    }
}
