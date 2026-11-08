import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class GoogleCalendarSyncDTO {
    @ApiProperty({
        description:
            'ID do agendamento para sincronizar. Sem valor sincroniza todos.',
        example: 1,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    schedule_id?: number;
}
