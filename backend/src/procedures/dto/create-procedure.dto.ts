import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProcedureDto {
    @ApiProperty({ description: 'Nome do procedimento', example: 'Limpeza de pele' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'Descrição do procedimento', example: 'Procedimento de limpeza profunda da pele' })
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty({ description: 'Duração em minutos', example: 60 })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    duration_minutes: number;

    @ApiProperty({ description: 'Preço do procedimento', example: 150.00 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    price: number;

    @ApiProperty({ description: 'Número de sessões', example: 3 })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    sessions: number;

    @ApiProperty({ description: 'Requer triagem prévia', example: true })
    @IsNotEmpty()
    @IsBoolean()
    triagem: boolean;

    @ApiProperty({ description: 'Duração da triagem em minutos', example: 30 })
    @IsNotEmpty()
    @IsInt()
    @Min(0)
    triagem_minutes: number;

    @ApiProperty({ description: 'Período de bloqueio em dias após o procedimento', example: 30, required: false, nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    bloqueio_periodo?: number | null;
}
