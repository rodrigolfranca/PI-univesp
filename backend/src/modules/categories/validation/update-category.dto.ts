import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateCategoryDto {
    @ApiProperty({
        description: 'Nome da categoria',
        example: 'Estética',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Length(1, 150)
    name?: string;
}
