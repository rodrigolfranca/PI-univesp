import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from "class-validator";

export class UsersCreateDTO {
    @ApiProperty({
        description: 'Nome completo do usuário',
        example: 'João da Silva',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    @Length(3, 150)
    @Matches(/^[a-záéíóúãõâêôàçñ\s\-']+$/i, {
        message: 'Nome deve conter apenas letras, espaços, hífens e apóstrofos'
    })
    name: string;

    @ApiProperty({
        description: 'Número de telefone do usuário (apenas dígitos, 11 caracteres)',
        example: '11953797436',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    @Matches(/^\d{11}$/, {
        message: 'Telefone deve conter exatamente 11 dígitos: 11953797436'
    })
    phone_number: string;

    @ApiProperty({
        description: 'Indica se o número de telefone foi confirmado',
        example: true,
        type: Boolean,
    })
    @IsNotEmpty()
    @IsBoolean()
    phone_number_confirmed: boolean;

    @ApiProperty({
        description: 'Endereço de email do usuário',
        example: 'joao.silva@example.com',
        type: String,
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Indica se o usuário é um administrador',
        example: false,
        type: Boolean,
    })
    @IsOptional()
    @IsBoolean()
    is_admin: boolean = false;
}
