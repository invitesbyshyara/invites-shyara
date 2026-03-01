const blacklist = new Set<string>();

export function blacklistToken(jti: string) {
  blacklist.add(jti);

  setTimeout(() => {
    blacklist.delete(jti);
  }, 8 * 60 * 60 * 1000);
}

export function isBlacklisted(jti: string): boolean {
  return blacklist.has(jti);
}
