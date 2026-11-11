/** Pages and routes that can be opened without signing in. Everything else is private. */
const PUBLIC_PREFIXES = ["/login", "/auth/", "/api/health"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname === prefix.replace(/\/$/, "") ||
      pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`),
  );
}
