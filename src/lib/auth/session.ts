import "server-only";
import { redirect } from "next/navigation";
import { ownerEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { isOwnerEmail } from "./owner";

/**
 * Use at the top of every private page, action and route.
 * Returns the signed-in owner, or sends the visitor to the sign-in page.
 */
export async function requireOwner() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");
  if (!isOwnerEmail(user.email, ownerEmail())) {
    await supabase.auth.signOut();
    redirect("/login?error=not-allowed");
  }
  return { id: user.id, email: user.email as string };
}
