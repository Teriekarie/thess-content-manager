"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/session";
import {
  METRIC_PLATFORMS,
  PAGE_FIELDS,
  POST_FIELDS,
  parseMetric,
  type MetricPlatform,
} from "@/lib/content/metrics";
import { isValidDate, lagosToday, weekStart } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

function readNumbers(form: FormData, fields: readonly { name: string }[], prefix = "") {
  const values: Record<string, number | null> = {};
  for (const field of fields) {
    const parsed = parseMetric(text(form, prefix + field.name));
    if (parsed === "invalid") return null;
    values[field.name] = parsed;
  }
  return values;
}

/** Saves one platform's page numbers for one week. Saving again for the same week replaces them. */
export async function savePageMetrics(form: FormData) {
  const owner = await requireOwner();
  const platform = z
    .enum(Object.keys(METRIC_PLATFORMS) as [MetricPlatform, ...MetricPlatform[]])
    .safeParse(text(form, "platform"));
  const week = text(form, "week");
  if (!platform.success || !isValidDate(week) || week > lagosToday()) redirect("/analytics?error=week");

  const values = readNumbers(form, PAGE_FIELDS);
  if (!values) redirect("/analytics?error=number");
  if (Object.values(values).every((v) => v === null)) redirect("/analytics?error=empty");

  const supabase = await createClient();
  const { error } = await supabase.from("platform_metrics").upsert(
    {
      profile_id: owner.id,
      platform: platform.data,
      week_start: weekStart(week),
      ...values,
      measurement_source: "manual",
    },
    { onConflict: "profile_id,platform,week_start" },
  );
  if (error) redirect("/analytics?error=save");
  revalidatePath("/analytics");
  redirect("/analytics?saved=page");
}

/** Saves the numbers for one posted piece. */
export async function savePostMetrics(form: FormData) {
  const owner = await requireOwner();
  const id = z.uuid().safeParse(text(form, "id"));
  if (!id.success) redirect("/analytics");

  const values = readNumbers(form, POST_FIELDS);
  if (!values) redirect("/analytics?error=number#posts");

  const supabase = await createClient();
  const { error } = await supabase.from("post_metrics").upsert(
    {
      profile_id: owner.id,
      post_id: id.data,
      ...values,
      measurement_source: "manual",
      measured_at: new Date().toISOString(),
    },
    { onConflict: "post_id" },
  );
  if (error) redirect("/analytics?error=save#posts");
  revalidatePath("/analytics");
  redirect("/analytics?saved=post#posts");
}
