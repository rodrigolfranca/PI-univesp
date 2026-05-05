import { ApiProperty } from '@nestjs/swagger';
import { IsBase64, IsInt, IsNotEmpty, IsOptional, IsString, Matches, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PopsCreateDTO {
  @ApiProperty({ description: 'Procedure id', example: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  procedure_id: number;

  @ApiProperty({ description: 'Filename (must end with .pdf)', example: 'triagem.pdf', type: String })
  @IsString()
  @IsNotEmpty()
  @Matches(/\.pdf$/i, { message: 'Filename must end with .pdf' })
  name: string;

  @ApiProperty({ description: 'MIME type (application/pdf)', example: 'application/pdf', required: false, type: String })
  @IsOptional()
  @IsString()
  @IsIn(['application/pdf'], { message: 'mime_type must be application/pdf' })
  mime_type?: string;

  @ApiProperty({ description: 'Base64-encoded file content (PDF)', type: String })
  @IsBase64()
  @IsNotEmpty()
  base64: string;
}
