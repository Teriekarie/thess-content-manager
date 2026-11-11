import { describe, expect, it } from "vitest";
import { isOwnerEmail } from "@/lib/auth/owner";

describe("isOwnerEmail", () => {
  const owner = "owner@example.com";

  it("accepts the owner address", () => {
    expect(isOwnerEmail("owner@example.com", owner)).toBe(true);
  });
  it("ignores case and surrounding spaces", () => {
    expect(isOwnerEmail("  Owner@Example.COM ", owner)).toBe(true);
  });
  it("rejects any other address", () => {
    expect(isOwnerEmail("someone@example.com", owner)).toBe(false);
    expect(isOwnerEmail("owner@example.com.evil.test", owner)).toBe(false);
  });
  it("rejects missing values", () => {
    expect(isOwnerEmail(null, owner)).toBe(false);
    expect(isOwnerEmail(undefined, owner)).toBe(false);
    expect(isOwnerEmail("", owner)).toBe(false);
    expect(isOwnerEmail("owner@example.com", "")).toBe(false);
    expect(isOwnerEmail("", "")).toBe(false);
  });
});
