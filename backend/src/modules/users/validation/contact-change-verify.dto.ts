import { ApiProperty } from '@nestjs/swagger';
import {
    IsIn,
    IsNotEmpty,
    IsNumberString,
    IsString,
    Matches,
} from 'class-validator';

export class ContactChangeVerifyDTO {
    @ApiProperty({
        description: 'Campo a alterar',
        enum: ['phone', 'email'],
        example: 'phone',
    })
    @IsIn(['phone', 'email'])
    field: 'phone' | 'email';

    @ApiProperty({
        description: 'Novo telefone ou e-mail',
        example: '11999999999',
    })
    @IsNotEmpty()
    @IsString()
    value: string;

    @ApiProperty({
        description: 'Código recebido no novo contato',
        example: '123456',
    })
    @IsNotEmpty()
    @IsNumberString()
    @Matches(/^\d{6}$/)
    code: string;
}
