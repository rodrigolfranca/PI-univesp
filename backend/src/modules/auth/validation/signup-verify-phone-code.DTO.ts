import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsUUID, Matches } from 'class-validator';

export class SignupVerifyPhoneCodeDTO {
    @ApiProperty({
        description: 'Identificador temporário do cadastro',
        example: '0f8fad5b-d9cb-469f-a165-70867728950e',
        type: String,
    })
    @IsNotEmpty()
    @IsUUID()
    signup_id: string;

    @ApiProperty({
        description: 'Código enviado ao telefone',
        example: '123456',
        type: String,
    })
    @IsNotEmpty()
    @IsNumberString()
    @Matches(/^\d{6}$/, {
        message: 'O código do telefone deve conter exatamente 6 dígitos',
    })
    phone_code: string;
}
