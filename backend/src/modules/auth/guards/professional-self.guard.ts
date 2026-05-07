import {
    CanActivate,
    ExecutionContext,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { RequestWithUser } from 'src/common/types/request.type';

@Injectable()
export class ProfessionalOrSelfGuard implements CanActivate {
    constructor() {}

    logger = new Logger(ProfessionalOrSelfGuard.name);

    canActivate(context: ExecutionContext): boolean {
        try {
            const request = context
                .switchToHttp()
                .getRequest<RequestWithUser>();

            const userIsProfessional =
                request.user && request.user.professional;
            const userIsSelf =
                request.user && request.user.id === Number(request.params.id);

            if (!userIsProfessional && !userIsSelf) {
                throw new UnauthorizedException(
                    'User is not a professional or the owner of the resource',
                );
            }

            return true;
        } catch (e) {
            this.logger.error(`Authentication failed: ${e}`);
            throw new InternalServerErrorException(
                'Error while trying to authenticate user',
            );
        }
    }
}
