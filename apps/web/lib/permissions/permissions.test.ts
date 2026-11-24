import { describe, expect, it } from "vitest";
import { canAccessAdminDashboard, canEditOperations, isInstructorPortal, isSuperAdmin } from ".";

describe("permissions", () => {
  it("identifies super admin", () => expect(isSuperAdmin({ permission_level: "SUPER_ADMIN" })).toBe(true));
  it("blocks pending dashboard access", () => expect(canAccessAdminDashboard({ permission_level: "EDITOR", account_status: "PENDING" })).toBe(false));
  it("allows active editor dashboard access", () => expect(canAccessAdminDashboard({ permission_level: "EDITOR", account_status: "ACTIVE" })).toBe(true));
  it("blocks instructor portal from admin dashboard", () => {
    const p = { permission_level: "INSTRUCTOR_PORTAL" as const, account_status: "ACTIVE" as const };
    expect(isInstructorPortal(p)).toBe(true);
    expect(canAccessAdminDashboard(p)).toBe(false);
  });
  it("allows only active editor/admin/superadmin to mutate operations data", () => {
    expect(canEditOperations({ permission_level: "EDITOR", account_status: "ACTIVE" })).toBe(true);
    expect(canEditOperations({ permission_level: "VIEWER", account_status: "ACTIVE" })).toBe(false);
    expect(canEditOperations({ permission_level: "INSTRUCTOR_PORTAL", account_status: "ACTIVE" })).toBe(false);
    expect(canEditOperations({ permission_level: "ADMIN", account_status: "PENDING" })).toBe(false);
  });
});
