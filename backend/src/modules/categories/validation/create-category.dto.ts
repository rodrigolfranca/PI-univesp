import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({ description: 'Nome da categoria', example: 'Estética' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 150)
    name: string;
}
