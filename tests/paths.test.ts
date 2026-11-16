import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/lib/auth/paths";

describe("isPublicPath", () => {
  it("allows the sign-in page, the sign-in link landing route and the health check", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/api/health")).toBe(true);
  });
  it("keeps every app page private", () => {
    for (const path of ["/", "/week", "/calendar", "/inbox", "/dates", "/analytics", "/settings"]) {
      expect(isPublicPath(path)).toBe(false);
    }
  });
  it("lets the scheduler reach its job, which checks its own secret", () => {
    expect(isPublicPath("/api/jobs/weekly-plan")).toBe(true);
    expect(isPublicPath("/api/jobsx")).toBe(false);
  });
  it("keeps other API routes private", () => {
    expect(isPublicPath("/api/ideas")).toBe(false);
    expect(isPublicPath("/api/healthcheck-other")).toBe(false);
  });
  it("is not fooled by look-alike paths", () => {
    expect(isPublicPath("/login-admin")).toBe(false);
    expect(isPublicPath("/authx")).toBe(false);
  });
});
