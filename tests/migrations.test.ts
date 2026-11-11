import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dir = path.resolve(__dirname, "../supabase/migrations");
const sql = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(path.join(dir, f), "utf8"))
  .join("\n");

describe("database migrations", () => {
  it("every table has Row Level Security switched on", () => {
    const tables = [...sql.matchAll(/create table\s+(?:if not exists\s+)?public\.(\w+)/gi)].map(
      (m) => m[1],
    );
    expect(tables.length).toBeGreaterThan(0);
    for (const table of tables) {
      expect(sql, table).toMatch(
        new RegExp(`alter table\\s+public\\.${table}\\s+enable row level security`, "i"),
      );
    }
  });

  it("no policy is open to signed-out visitors", () => {
    expect(sql).not.toMatch(/to\s+anon/i);
    expect(sql).not.toMatch(/using\s*\(\s*true\s*\)/i);
  });
});
