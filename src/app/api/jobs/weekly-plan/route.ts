import { NextResponse, type NextRequest } from "next/server";
import { isAuthorisedCron } from "@/lib/auth/cron";
import { lagosToday } from "@/lib/dates";
import { ownerEmail } from "@/lib/env";
import { planWeek, recordPlanRun } from "@/lib/planning";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

/**
 * The automatic weekly plan. Vercel calls this every Sunday at 17:00 UTC, which is
 * 18:00 in Lagos (UTC+1 all year, no daylight saving). It only writes drafts;
 * nothing is ever posted. Calling it twice does no harm: it only fills free days.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorisedCron(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "not authorised" }, { status: 401 });
  }
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("owner_email", ownerEmail())
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "owner not found" }, { status: 503 });

  const started = new Date();
  const today = lagosToday();
  try {
    const result = await planWeek(supabase, profile.id, { week: today, today, source: "schedule" });
    await recordPlanRun(supabase, profile.id, "schedule", started, result);
    return NextResponse.json({ status: result.status, week: result.week, made: result.made, failed: result.failed });
  } catch {
    await recordPlanRun(supabase, profile.id, "schedule", started, null, "The run stopped unexpectedly.");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
