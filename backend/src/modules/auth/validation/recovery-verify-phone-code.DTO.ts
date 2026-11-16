import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsUUID, Matches } from 'class-validator';

export class RecoveryVerifyPhoneCodeDTO {
    @ApiProperty({
        description: 'Identificador temporário da recuperação',
        example: '0f8fad5b-d9cb-469f-a165-70867728950e',
        type: String,
    })
    @IsNotEmpty()
    @IsUUID()
    recovery_id: string;

    @ApiProperty({
        description: 'Novo telefone que receberá o código',
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
        description: 'Código enviado ao novo telefone',
        example: '654321',
        type: String,
    })
    @IsNotEmpty()
    @IsNumberString()
    @Matches(/^\d{6}$/, {
        message: 'O código do telefone deve conter exatamente 6 dígitos',
    })
    phone_code: string;
}
