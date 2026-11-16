import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SignupResendPhoneCodeDTO {
    @ApiProperty({
        description: 'Identificador temporário do cadastro',
        example: '0f8fad5b-d9cb-469f-a165-70867728950e',
        type: String,
    })
    @IsNotEmpty()
    @IsUUID()
    signup_id: string;
}
