import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, Matches } from "class-validator";

export class LoginVerifyCodeDTO {
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

    @ApiProperty({
        description:
            'Código de verificação enviado ao usuário (apenas dígitos, 6 caracteres)',
        example: '123456',
        type: String,
    })
    @IsNotEmpty()
    @IsNumberString()
    @Matches(/^\d{6}$/, {
        message: 'O código de verificação deve conter exatamente 6 dígitos',
    })
    verification_code: string;
}
