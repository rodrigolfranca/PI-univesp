import { ForbiddenException } from '@nestjs/common';
import { UserWithType } from '../../../common/types/users.type';

export function assertProfessionalAccess(
    user: UserWithType,
    professionalId: number,
): void {
    if (user.professional?.is_admin) return;
    if (!user.professional || user.professional.id !== professionalId) {
        throw new ForbiddenException(
            'Você só pode gerenciar a própria disponibilidade',
        );
    }
}
