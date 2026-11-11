import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Public status check. Reports only "ok" or "unreachable", never data or settings. */
export async function GET() {
  let database: "ok" | "unreachable" = "unreachable";
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (!error) database = "ok";
  } catch {
    database = "unreachable";
  }
  return NextResponse.json(
    { app: "ok", database },
    { status: database === "ok" ? 200 : 503 },
  );
}
