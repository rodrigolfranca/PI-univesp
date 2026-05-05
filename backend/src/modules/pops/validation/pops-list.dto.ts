import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PopsListDTO {
  @ApiProperty({ description: 'Page number (default:1)', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ description: 'Items per page (default:10, max:100)', example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiProperty({ description: 'Filter by procedure id', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  procedure_id?: number;
}
