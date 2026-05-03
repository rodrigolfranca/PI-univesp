import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, Matches } from "class-validator";

export class LoginRequestCodeDTO {
    @ApiProperty({
        description:
            'Número de telefone do usuário (apenas dígitos, 11 caracteres)',
        example: '11953797436',
        type: String,
    })
    @IsNotEmpty()
    @IsNumberString()
    @Matches(/^\d{11}$/, {
        message: 'Telefone deve conter exatamente 11 dígitos: 11953797436',
    })
    phone_number: string;
}
