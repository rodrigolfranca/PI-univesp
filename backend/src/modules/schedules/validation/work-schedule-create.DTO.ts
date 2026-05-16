import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsPositive,
    Matches,
    Max,
    Min,
} from 'class-validator';

export class WorkScheduleCreateDto {
    @ApiProperty({
        description:
            'ID do profissional para o qual o horário de trabalho será criado',
        example: 1,
        type: Number,
        required: true,
    })
    @IsNotEmpty()
    @IsPositive()
    professional_id: number;

    @ApiProperty({
        description:
            'Lista de números dos dias da semana para os quais o horário de trabalho será criado (0 para domingo, 6 para sábado)',
        example: [1, 3, 5],
        type: [Number],
        required: true,
    })
    @IsNotEmpty()
    @IsArray()
    @Max(6, { each: true })
    @Min(0, { each: true })
    @Transform(({ value }: { value: number[] }) => {
        return [...new Set(value)];
    })
    days_of_week: number[];

    @ApiProperty({
        description:
            'Horário de início para o horário de trabalho (formato HH:mm)',
        example: '08:00',
        type: String,
        required: true,
    })
    @IsNotEmpty()
    @Matches(/^\d{2}:\d{2}$/)
    start_time: string;

    @ApiProperty({
        description:
            'Horário de término para o horário de trabalho (formato HH:mm)',
        example: '17:00',
        type: String,
        required: true,
    })
    @IsNotEmpty()
    @Matches(/^\d{2}:\d{2}$/)
    end_time: string;
}
