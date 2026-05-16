import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsPositive,
    Matches,
    Min,
} from 'class-validator';

export class ScheduleCreateDto {
    @ApiProperty({ description: 'ID do procedimento', example: 1 })
    @IsNotEmpty()
    @IsPositive()
    procedure_id: number;

    @ApiProperty({ description: 'ID do profissional', example: 1 })
    @IsNotEmpty()
    @IsPositive()
    professional_id: number;

    @ApiProperty({ description: 'ID do cliente', example: 1 })
    @IsNotEmpty()
    @IsPositive()
    client_id: number;

    @ApiProperty({ description: 'ID do documento', example: 1 })
    @IsNotEmpty()
    @IsPositive()
    document_id: number;

    @ApiProperty({
        description: 'Data do agendamento (YYYY-MM-DD)',
        example: '2026-05-20',
    })
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @ApiProperty({ description: 'Horário de início (HH:mm)', example: '09:00' })
    @IsNotEmpty()
    @Matches(/^\d{2}:\d{2}$/)
    start_time: string;

    @ApiProperty({ description: '0 = triagem, 1+ = sessão normal', example: 0 })
    @IsNotEmpty()
    @IsInt()
    @Min(0)
    session: number;
}
