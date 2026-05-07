export interface RequestWithUser extends Request {
    user: {
        id: number;
        phone_number: string;
        email: string;
    };
}
