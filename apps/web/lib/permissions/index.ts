import type { Profile } from "@aileaders/domain";
export const isSuperAdmin = (p: Pick<Profile,"permission_level">) => p.permission_level === "SUPER_ADMIN";
export const isInstructorPortal = (p: Pick<Profile,"permission_level">) => p.permission_level === "INSTRUCTOR_PORTAL";
export const canAccessAdminDashboard = (p: Pick<Profile,"permission_level"|"account_status">) => p.account_status === "ACTIVE" && p.permission_level !== "INSTRUCTOR_PORTAL";

export const canEditOperations = (p: Pick<Profile,"permission_level"|"account_status">) => p.account_status === "ACTIVE" && ["SUPER_ADMIN","ADMIN","EDITOR"].includes(p.permission_level);

export const canManageImports = (p: Pick<Profile,"permission_level"|"account_status">) => p.account_status === "ACTIVE" && ["SUPER_ADMIN","ADMIN"].includes(p.permission_level);

export const canManageFinance = (p: Pick<Profile,"permission_level"|"account_status"|"job_role">) => p.account_status === "ACTIVE" && (p.permission_level === "SUPER_ADMIN" || p.permission_level === "ADMIN" || p.job_role === "ACCOUNTING");
export const canManageInstructorAccounts = (p: Pick<Profile,"permission_level"|"account_status">) => p.account_status === "ACTIVE" && ["SUPER_ADMIN","ADMIN"].includes(p.permission_level);
