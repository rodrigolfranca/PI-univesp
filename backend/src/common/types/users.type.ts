export interface UserWithType {
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
