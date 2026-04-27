import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UsersListDTO {
    @ApiProperty({
        description: 'Número da página para paginação (padrão: 1)',
        example: 1,
        type: Number,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiProperty({
        description: 'Número de itens por página para paginação (padrão: 10)',
        example: 10,
        type: Number,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(30)
    limit: number = 10;
}
