import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PopsUpdateDTO {
    @ApiProperty({
        description: 'POP name',
        example: 'Triagem de clientes v2',
        required: false,
    })
    @IsOptional()
    @IsString()
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
