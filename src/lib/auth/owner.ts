/** True only when `email` is the configured owner address (case and spacing ignored). */
export function isOwnerEmail(
  email: string | null | undefined,
  owner: string | null | undefined,
): boolean {
  if (!email || !owner) return false;
  const a = email.trim().toLowerCase();
  const b = owner.trim().toLowerCase();
  return a.length > 0 && a === b;
}
