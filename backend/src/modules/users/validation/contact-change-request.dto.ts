import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ContactChangeRequestDTO {
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
}
