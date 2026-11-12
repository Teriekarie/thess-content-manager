import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { ownerEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { isOwnerEmail } from "./owner";

/**
 * Use at the top of every private page, action and route.
 * Returns the signed-in owner, or sends the visitor to the sign-in page.
 * The check runs once per page load, however many places ask for it.
 */
export const requireOwner = cache(async function requireOwner() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");
  if (!isOwnerEmail(user.email, ownerEmail())) {
    await supabase.auth.signOut();
    redirect("/login?error=not-allowed");
  }
  return { id: user.id, email: user.email as string };
});
