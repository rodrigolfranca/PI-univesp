import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class PopsUpdateDTO {
    @ApiProperty({
        description: 'Filename',
        example: 'triagem-v2.pdf',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Matches(/\.pdf$/i, { message: 'Filename must end with .pdf' })
    name?: string;

    @ApiProperty({
        description: 'Procedure id (optional if you want to reassign)',
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    procedure_id?: number;
}
