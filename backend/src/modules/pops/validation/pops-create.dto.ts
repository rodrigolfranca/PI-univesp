import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class PopsCreateDTO {
    @ApiProperty({ description: 'Procedure id', example: 1, type: Number })
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    procedure_id: number;

    @ApiProperty({
        description: 'Filename (must end with .pdf)',
        example: 'triagem.pdf',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/\.pdf$/i, { message: 'Filename must end with .pdf' })
    name: string;
}
