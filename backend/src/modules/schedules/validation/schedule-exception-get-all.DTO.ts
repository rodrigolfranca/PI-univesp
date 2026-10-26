import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
    Max,
    Min,
} from 'class-validator';
import { ScheduleExceptionType } from 'src/common/models/schedule-exceptions.model';

export class ScheduleExceptionGetAllDto {
    @ApiProperty({ required: false, example: 1 })
    @IsOptional()
    @IsNumber()
    @IsInt()
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

    @ApiProperty({ required: false, example: 1 })
    @IsOptional()
    @IsNumber()
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiProperty({ required: false, example: 10 })
    @IsOptional()
    @IsNumber()
    @IsInt()
    @Min(1)
    @Max(30)
    limit: number = 10;
}
