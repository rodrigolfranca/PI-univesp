import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsIn,
    IsInt,
    IsOptional,
    IsPositive,
    Matches,
    Min,
} from 'class-validator';
import { ScheduleStatus } from 'src/common/consts/schedule.status';

export class ScheduleUpdateDto {
    @ApiProperty({ required: false, example: 1 })
    @IsOptional()
    @IsPositive()
    procedure_id: number;

    @ApiProperty({ required: false, example: 1 })
    @IsOptional()
    @IsPositive()
    professional_id: number;

    @ApiProperty({ required: false, example: 1 })
    @IsOptional()
    @IsPositive()
    client_id: number;

    @ApiProperty({ required: false, example: 1 })
    @IsOptional()
    @IsPositive()
    document_id: number;

    @ApiProperty({ required: false, example: '2026-05-20' })
    @IsOptional()
    @IsDateString()
    date: string;

    @ApiProperty({ required: false, example: '09:00' })
    @IsOptional()
    @Matches(/^\d{2}:\d{2}$/)
    start_time: string;

    @ApiProperty({ required: false, example: 1 })
    @IsOptional()
    @IsInt()
    @Min(0)
    session: number;

    @ApiProperty({ required: false, enum: Object.values(ScheduleStatus) })
    @IsOptional()
    @IsIn(Object.values(ScheduleStatus))
    status: string;
}
