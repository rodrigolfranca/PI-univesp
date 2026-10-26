import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
    Matches,
    Max,
    Min,
} from 'class-validator';

export class WorkScheduleGetAllDto {
    @ApiProperty({
        description:
            'Número do dia da semana para filtrar os horários de trabalho (0 para domingo, 6 para sábado)',
        example: 1,
        type: Number,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @IsInt()
    @Max(6)
    @Min(0)
    day_of_week: number;

    @ApiProperty({
        description:
            'Horário de início para filtrar os horários de trabalho (formato HH:mm)',
        example: '08:00',
        type: String,
        required: false,
    })
    @IsOptional()
    @Matches(/^\d{2}:\d{2}$/)
    start_time: string;

    @ApiProperty({
        description:
            'Horário de término para filtrar os horários de trabalho (formato HH:mm)',
        example: '17:00',
        type: String,
        required: false,
    })
    @IsOptional()
    @Matches(/^\d{2}:\d{2}$/)
    end_time: string;

    @ApiProperty({
        description: 'ID do profissional para filtrar os horários de trabalho',
        example: 1,
        type: Number,
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value as string, 10))
    @IsNumber()
    @IsInt()
    @IsPositive()
    professional_id: number;
}
