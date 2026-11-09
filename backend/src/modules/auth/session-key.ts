export const ACCESS_TOKEN_TTL_SECONDS = 2 * 24 * 60 * 60;

export function sessionKey(siteId: string | undefined, jti: string): string {
    return `${siteId || 'site'}:session:${jti}`;
}
