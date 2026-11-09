import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GalleryUpdateDTO {
    @ApiProperty({ example: 'Antes e depois', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;
}
