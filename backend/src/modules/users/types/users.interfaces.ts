export interface UsersList {
    total: number;
    page: number;
    limit: number;
    users: UsersWithType[];
}

export interface UsersWithType {
    id: number;
    name: string;
    phone_number: string;
    phone_number_confirmed: boolean;
    email: string;
    email_confirmed: boolean;
    professional?: {
        id: number;
        is_admin: boolean;
    };
    client?: {
        id: number;
    };
}
