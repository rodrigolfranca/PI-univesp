import { ApiProperty } from '@nestjs/swagger';
import { IsBase64, IsInt, IsOptional, IsString, Matches, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PopsUpdateDTO {
  @ApiProperty({ description: 'Filename', example: 'triagem-v2.pdf', required: false })
  @IsOptional()
  @IsString()
  @Matches(/\.pdf$/i, { message: 'Filename must end with .pdf' })
  name?: string;

  @ApiProperty({ description: 'MIME type', example: 'application/pdf', required: false })
  @IsOptional()
  @IsString()
  @IsIn(['application/pdf'], { message: 'mime_type must be application/pdf' })
  mime_type?: string;

  @ApiProperty({ description: 'Base64-encoded file content', required: false })
  @IsOptional()
  @IsBase64()
  base64?: string;

  @ApiProperty({ description: 'Procedure id (optional if you want to reassign)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  procedure_id?: number;
}
