import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsIn,
    IsNotEmpty,
    IsOptional,
    IsPositive,
    IsString,
    Length,
    Matches,
} from 'class-validator';
import { ScheduleExceptionType } from '../../../common/models/schedule-exceptions.model';

export class ScheduleExceptionCreateDto {
    @ApiProperty({ description: 'ID do profissional', example: 1 })
    @IsNotEmpty()
    @IsPositive()
    professional_id: number;

    @ApiProperty({
        description: 'Data da exceção (YYYY-MM-DD)',
        example: '2026-05-25',
    })
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @ApiProperty({
        description:
            '"open" abre disponibilidade fora do horário de trabalho; "blocked" bloqueia um horário já aberto',
        enum: Object.values(ScheduleExceptionType),
        example: 'blocked',
    })
    @IsNotEmpty()
    @IsIn(Object.values(ScheduleExceptionType))
    type: string;

    @ApiProperty({
        description: 'Nome ou motivo da exceção',
        example: 'Feriado',
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    name?: string | null;

    @ApiProperty({
        description: 'Horário de início (HH:mm). Nulo = dia inteiro',
        required: false,
        nullable: true,
        example: '09:00',
    })
    @IsOptional()
    @Matches(/^\d{2}:\d{2}$/)
    start_time?: string | null;

    @ApiProperty({
        description: 'Horário de término (HH:mm). Nulo = dia inteiro',
        required: false,
        nullable: true,
        example: '10:00',
    })
    @IsOptional()
    @Matches(/^\d{2}:\d{2}$/)
    end_time?: string | null;
}
