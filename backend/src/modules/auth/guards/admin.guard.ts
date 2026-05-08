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
export class AdminGuard implements CanActivate {
    constructor() { }

    logger = new Logger(AdminGuard.name);

    canActivate(context: ExecutionContext): boolean {
        try {
            const request = context
                .switchToHttp()
                .getRequest<RequestWithUser>();

            console.log(request.user)

            if (
                !request.user ||
                !request.user.professional ||
                !request.user.professional.is_admin
            ) {
                throw new UnauthorizedException('User is not an admin');
            }

            return true;
        } catch (e) {
            this.logger.error(`Authentication failed: ${e}`);
            Utils.handleError(e);
        }
    }
}
