import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    Length,
    Matches,
} from 'class-validator';

export class SignupRequestCodeDTO {
    @ApiProperty({
        description: 'Nome completo do usuário',
        example: 'João da Silva',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    @Length(3, 150)
    @Matches(/^[a-záéíóúãõâêôàçñ\s\-']+$/i, {
        message: 'Nome deve conter apenas letras, espaços, hífens e apóstrofos',
    })
    name: string;

    @ApiProperty({
        description:
            'Número de telefone do usuário (apenas dígitos, 11 caracteres)',
        example: '11953797436',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    @Matches(/^\d{11}$/, {
        message: 'Telefone deve conter exatamente 11 dígitos: 11953797436',
    })
    phone_number: string;

    @ApiProperty({
        description: 'Endereço de email do usuário',
        example: 'joao.silva@example.com',
        type: String,
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;
}
