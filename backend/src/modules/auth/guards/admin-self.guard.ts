import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { RequestWithUser } from 'src/common/types/request.type';
import { Utils } from 'src/common/utils/utils';

@Injectable()
export class AdminOrSelfGuard implements CanActivate {
    constructor() {}

    logger = new Logger(AdminOrSelfGuard.name);

    canActivate(context: ExecutionContext): boolean {
        try {
            const request = context
                .switchToHttp()
                .getRequest<RequestWithUser>();

            const userIsAdmin =
                request.user &&
                request.user.professional &&
                request.user.professional.is_admin;
            const userIsSelf =
                request.user && request.user.id === Number(request.params.id);

            if (!userIsAdmin && !userIsSelf) {
                throw new UnauthorizedException(
                    'User is not an admin or the owner of the resource',
                );
            }

            return true;
        } catch (e) {
            this.logger.error(`Authentication failed: ${e}`);
            Utils.handleError(e);
        }
    }
}
