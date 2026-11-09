export interface JwtPayload {
    keyType: string;
    id: number;
    jti?: string;
}
