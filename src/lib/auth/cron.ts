import { timingSafeEqual } from "node:crypto";

/** True only when the request carries the scheduler's secret. No secret set means nobody gets in. */
export function isAuthorisedCron(header: string | null, secret: string | undefined): boolean {
  const expected = secret?.trim();
  if (!expected || expected.length < 16 || !header) return false;
  const given = Buffer.from(header);
  const wanted = Buffer.from(`Bearer ${expected}`);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}
