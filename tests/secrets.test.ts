import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}

const source = files(path.join(root, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
const ALLOWED_PUBLIC = new Set([
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]);

describe("secrets stay on the server", () => {
  it("only the three approved settings are exposed to the browser", () => {
    const names = new Set<string>();
    const sources = [...source, path.join(root, ".env.example")];
    for (const file of sources) {
      for (const match of readFileSync(file, "utf8").matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) {
        names.add(match[0]);
      }
    }
    for (const name of names) expect(ALLOWED_PUBLIC.has(name), name).toBe(true);
  });

  it("browser components never read server settings", () => {
    for (const file of source) {
      const text = readFileSync(file, "utf8");
      if (!/^\s*["']use client["']/.test(text)) continue;
      const serverReads = [...text.matchAll(/process\.env\.([A-Z0-9_]+)/g)]
        .map((m) => m[1])
        .filter((name) => !name.startsWith("NEXT_PUBLIC_"));
      expect(serverReads, file).toEqual([]);
    }
  });

  it("the service-role key is not used anywhere in Phase 0", () => {
    for (const file of source) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/SERVICE_ROLE/);
    }
  });

  it("the example settings file contains names only, no values for secrets", () => {
    const text = readFileSync(path.join(root, ".env.example"), "utf8");
    expect(text).toMatch(/^OWNER_EMAIL=$/m);
    expect(text).toMatch(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=$/m);
    expect(text).toMatch(/^ANTHROPIC_API_KEY=$/m);
  });
});
