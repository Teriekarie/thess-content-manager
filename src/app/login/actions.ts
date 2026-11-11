"use server";

import { z } from "zod";
import { isOwnerEmail } from "@/lib/auth/owner";
import { ownerEmail, publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; message: string };

const SENT: LoginState = {
  status: "sent",
  message:
    "If that address is allowed to sign in, a link is on its way. Open it on this device.",
};

export async function sendSignInLink(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  // Same answer for every address, so the page never reveals who the owner is.
  if (!isOwnerEmail(parsed.data, ownerEmail())) return SENT;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${publicEnv().NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error) {
    return {
      status: "error",
      message: "The sign-in email could not be sent. Wait a minute and try again.",
    };
  }
  return SENT;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { redirect } = await import("next/navigation");
  redirect("/login");
}
