import { NextResponse, type NextRequest } from "next/server";
import { isOwnerEmail } from "@/lib/auth/owner";
import { ownerEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** The sign-in link in the email lands here. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const failed = new URL("/login?error=link-failed", request.url);
  if (!code) return NextResponse.redirect(failed);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(failed);

  if (!isOwnerEmail(data.user.email, ownerEmail())) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=not-allowed", request.url));
  }
  return NextResponse.redirect(new URL("/", request.url));
}
