import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsUUID, Matches } from 'class-validator';

export class RecoveryVerifyEmailCodeDTO {
    @ApiProperty({
        description: 'Identificador temporário da recuperação',
        example: '0f8fad5b-d9cb-469f-a165-70867728950e',
        type: String,
    })
    @IsNotEmpty()
    @IsUUID()
    recovery_id: string;

    @ApiProperty({
        description: 'Código enviado ao e-mail atual',
        example: '123456',
        type: String,
    })
    @IsNotEmpty()
    @IsNumberString()
    @Matches(/^\d{6}$/, {
        message: 'O código do e-mail deve conter exatamente 6 dígitos',
    })
    email_code: string;
}
