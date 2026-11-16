/** Pages and routes that can be opened without signing in. Everything else is private. */
// "/api/jobs/" has no sign-in because the scheduler calls it; each job checks CRON_SECRET itself.
const PUBLIC_PREFIXES = ["/login", "/auth/", "/api/health", "/api/jobs/"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname === prefix.replace(/\/$/, "") ||
      pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`),
  );
}
