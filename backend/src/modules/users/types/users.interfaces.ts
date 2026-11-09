import { UserWithType } from '../../../common/types/users.type';

export interface UsersList {
    total: number;
    page: number;
    limit: number;
    users: UserWithType[];
}
