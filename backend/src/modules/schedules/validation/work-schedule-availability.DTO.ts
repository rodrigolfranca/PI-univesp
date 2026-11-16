import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsDateString,
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
} from 'class-validator';

export class WorkScheduleAvailabilityDto {
    @ApiProperty({
        description: 'Data inicial no formato YYYY-MM-DD',
        example: '2026-11-15',
    })
    @IsDateString()
    from: string;

    @ApiProperty({
        description: 'Data final no formato YYYY-MM-DD',
        example: '2026-12-15',
    })
    @IsDateString()
    to: string;

    @ApiProperty({
        description: 'ID do procedimento para filtrar profissionais',
        required: false,
        example: 1,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value as string, 10))
    @IsNumber()
    @IsInt()
    @IsPositive()
    procedure_id?: number;
}
