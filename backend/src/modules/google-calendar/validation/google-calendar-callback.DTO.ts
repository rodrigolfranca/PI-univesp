import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleCalendarCallbackDTO {
    @ApiProperty({
        description: 'Código de autorização devolvido pelo Google',
        required: false,
        type: String,
    })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({
        description: 'Valor de state gerado na rota /google-calendar/connect',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    state: string;

    @ApiProperty({
        description:
            'Erro devolvido pelo Google quando o acesso é negado (ex.: access_denied)',
        required: false,
        type: String,
    })
    @IsOptional()
    @IsString()
    error?: string;
}
