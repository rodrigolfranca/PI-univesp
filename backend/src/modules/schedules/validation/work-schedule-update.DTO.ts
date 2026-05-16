import { ApiProperty } from '@nestjs/swagger';
import {
    IsNumber,
    IsOptional,
    IsPositive,
    Matches,
    Max,
    Min,
} from 'class-validator';

export class WorkScheduleUpdateDto {
    @ApiProperty({
        description:
            'ID do profissional para o qual o horário de trabalho será criado',
        example: 1,
        type: Number,
        required: false,
    })
    @IsOptional()
    @IsPositive()
    professional_id: number;

    @ApiProperty({
        description:
            'Número do dia da semana para o qual o horário de trabalho será criado (0 para domingo, 6 para sábado)',
        example: 1,
        type: Number,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Max(6)
    @Min(0)
    day_of_week: number;

    @ApiProperty({
        description:
            'Horário de início para o horário de trabalho (formato HH:mm)',
        example: '08:00',
        type: String,
        required: false,
    })
    @IsOptional()
    @Matches(/^\d{2}:\d{2}$/)
    start_time: string;

    @ApiProperty({
        description:
            'Horário de término para o horário de trabalho (formato HH:mm)',
        example: '17:00',
        type: String,
        required: false,
    })
    @IsOptional()
    @Matches(/^\d{2}:\d{2}$/)
    end_time: string;
}
