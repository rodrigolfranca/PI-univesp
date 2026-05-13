import { UserWithType } from 'src/common/types/users.type';

export interface UsersList {
    total: number;
    page: number;
    limit: number;
    users: UserWithType[];
}
