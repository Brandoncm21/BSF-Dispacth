import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS, hasAccess, type RoleType } from "./roles";

describe("ROLE_PERMISSIONS", () => {
  it("has all roles defined", () => {
    const roles = ["admin", "back_office", "dispatcher", "logistics", "sales"];
    roles.forEach((r) => {
      expect(ROLE_PERMISSIONS[r as RoleType]).toBeDefined();
    });
  });

  it("admin has access to all modules", () => {
    expect(ROLE_PERMISSIONS.admin.modules).toContain("*");
  });

  it("dispatcher has loads and traceability", () => {
    const modules = ROLE_PERMISSIONS.dispatcher.modules;
    expect(modules).toContain("loads");
    expect(modules).toContain("traceability");
  });
});

describe("hasAccess", () => {
  it("admin has access to everything", () => {
    expect(hasAccess("admin", "loads")).toBe(true);
    expect(hasAccess("admin", "human_resources")).toBe(true);
  });

  it("dispatcher cannot access human_resources", () => {
    expect(hasAccess("dispatcher", "human_resources")).toBe(false);
  });

  it("returns false for unknown role", () => {
    expect(hasAccess("unknown" as RoleType, "loads")).toBe(false);
  });
});
