import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RecoveryRequestCodeDTO {
    @ApiProperty({
        description: 'Endereço de email para recuperação.',
        example: 'joao.silva@example.com',
        type: String,
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;
}
