import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthGuard } from '../auth/guards';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './validation/create-category.dto';
import { UpdateCategoryDto } from './validation/update-category.dto';

@Controller('categories')
@ApiTags('Categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Get()
    @ApiOperation({ summary: 'Lista as categorias' })
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtém uma categoria' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.categoriesService.findOne(id);
    }

    @Post()
    @UseGuards(AuthGuard, AdminGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cria uma categoria' })
    create(@Body() dto: CreateCategoryDto) {
        return this.categoriesService.create(dto);
    }

    @Patch(':id')
    @UseGuards(AuthGuard, AdminGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Atualiza uma categoria' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCategoryDto,
    ) {
        return this.categoriesService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard, AdminGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Remove uma categoria' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.categoriesService.remove(id);
    }
}
