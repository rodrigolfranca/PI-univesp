import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PopsCreateDTO {
    @ApiProperty({ description: 'Procedure id', example: 1, type: Number })
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    procedure_id: number;

    @ApiProperty({
        description: 'POP name',
        example: 'Triagem de clientes',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    name: string;
}
