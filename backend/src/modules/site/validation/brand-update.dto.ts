import { Type } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BrandThemeDTO {
    @ApiProperty({ example: 'rose' })
    @IsString()
    @IsNotEmpty()
    preset: string;

    @ApiProperty({ example: {}, required: false })
    @IsOptional()
    @IsObject()
    palette: Record<string, string> = {};
}

export class BrandUpdateDTO {
    @ApiProperty({ example: 'Studio Dayane' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string;

    @ApiProperty({ example: null, required: false, nullable: true })
    @IsOptional()
    @IsString()
    logoUrl?: string | null;

    @ApiProperty({ type: BrandThemeDTO })
    @ValidateNested()
    @Type(() => BrandThemeDTO)
    theme: BrandThemeDTO;

    @ApiProperty({ example: 'Sobre nós' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    aboutTitle: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    aboutParagraphs: string[];

    @ApiProperty({ example: '5511987654321' })
    @IsString()
    @MaxLength(500)
    whatsappNumber: string;

    @ApiProperty({ example: 'studio' })
    @IsString()
    @MaxLength(100)
    instagramHandle: string;
}
