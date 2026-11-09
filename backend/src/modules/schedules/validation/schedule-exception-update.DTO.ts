import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsIn,
    IsOptional,
    IsPositive,
    IsString,
    Length,
    Matches,
} from 'class-validator';
import { ScheduleExceptionType } from '../../../common/models/schedule-exceptions.model';

export class ScheduleExceptionUpdateDto {
    @ApiProperty({ required: false, example: 1 })
    @IsOptional()
    @IsPositive()
    professional_id: number;

    @ApiProperty({ required: false, example: '2026-05-25' })
    @IsOptional()
    @IsDateString()
    date: string;

    @ApiProperty({
        required: false,
        enum: Object.values(ScheduleExceptionType),
    })
    @IsOptional()
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

    @ApiProperty({ required: false, nullable: true, example: '09:00' })
    @IsOptional()
    @Matches(/^\d{2}:\d{2}$/)
    start_time: string | null;

    @ApiProperty({ required: false, nullable: true, example: '10:00' })
    @IsOptional()
    @Matches(/^\d{2}:\d{2}$/)
    end_time: string | null;
}
