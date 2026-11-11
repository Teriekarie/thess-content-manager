import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

/** Settings that are safe to use in the browser. */
export function publicEnv() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      "Missing or invalid app settings. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return parsed.data;
}

/** The single email address allowed to sign in. Server only. */
export function ownerEmail(): string {
  const value = process.env.OWNER_EMAIL?.trim();
  if (!value) {
    throw new Error("Missing app setting OWNER_EMAIL.");
  }
  return value;
}

/**
 * The app's own web address, used in sign-in links. Server only.
 * Uses NEXT_PUBLIC_APP_URL when set, otherwise the address Vercel gives the project.
 */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
