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
import { ScheduleStatus } from 'src/common/consts/schedule.status';

export class ScheduleGetAllDto {
    @ApiProperty({ required: false, example: 1 })
    @IsOptional()
    @IsNumber()
    @IsInt()
    @IsPositive()
    professional_id: number;

    @ApiProperty({ required: false, example: 1 })
    @IsOptional()
    @IsNumber()
    @IsInt()
    @IsPositive()
    client_id: number;

    @ApiProperty({ required: false, example: '2026-05-20' })
    @IsOptional()
    @IsDateString()
    date: string;

    @ApiProperty({ required: false, enum: Object.values(ScheduleStatus) })
    @IsOptional()
    @IsIn(Object.values(ScheduleStatus))
    status: string;

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
