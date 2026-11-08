import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './repositories/categories.repository';
import { CreateCategoryDto } from './validation/create-category.dto';
import { UpdateCategoryDto } from './validation/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private readonly categoriesRepository: CategoriesRepository) {}

    findAll() {
        return this.categoriesRepository.findAll();
    }

    findOne(id: number) {
        return this.categoriesRepository.findOne(id);
    }

    create(dto: CreateCategoryDto) {
        return this.categoriesRepository.create(dto);
    }

    update(id: number, dto: UpdateCategoryDto) {
        return this.categoriesRepository.update(id, dto);
    }

    remove(id: number) {
        return this.categoriesRepository.remove(id);
    }
}
