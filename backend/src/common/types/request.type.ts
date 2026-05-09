import { Request } from 'express';
import { UserWithType } from './users.type';

export interface RequestWithUser extends Request {
    user: UserWithType;
}
