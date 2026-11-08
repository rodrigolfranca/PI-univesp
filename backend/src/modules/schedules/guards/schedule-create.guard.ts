import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/types/request.type';

type ScheduleBody = { client_id?: unknown };

@Injectable()
export class ScheduleCreateGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const user = request.user;
        const body = request.body as ScheduleBody | undefined;
        const clientId = Number(body?.client_id);

        if (user?.professional?.is_admin) return true;
        if (
            user?.client &&
            Number.isInteger(clientId) &&
            user.client.id === clientId
        ) {
            return true;
        }

        throw new UnauthorizedException(
            'User is not allowed to create this schedule',
        );
    }
}
