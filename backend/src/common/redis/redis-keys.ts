export function redisKey(
    siteId: string | undefined,
    ...parts: (string | number)[]
): string {
    return [siteId || 'site', ...parts].join(':');
}
