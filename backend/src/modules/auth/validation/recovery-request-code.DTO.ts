import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    Matches,
} from 'class-validator';

export class RecoveryRequestCodeDTO {
    @ApiProperty({
        description: 'Endereço de email para recuperação.',
        example: 'joao.silva@example.com',
        type: String,
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Novo telefone que receberá o código',
        example: '11953797436',
        required: false,
        type: String,
    })
    @IsOptional()
    @IsNumberString()
    @Matches(/^\d{11}$/, {
        message: 'Telefone deve conter exatamente 11 dígitos: 11953797436',
    })
    phone_number?: string;
}
