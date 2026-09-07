"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveProfile } from "@/lib/auth/profile";
import { isSuperAdmin } from "@/lib/permissions";
import type { JobRole, PermissionLevel } from "@aileaders/domain";

const jobs:JobRole[]=["CEO","OPERATIONS","SALES","INSTRUCTOR","ACCOUNTING"];
const permissions:PermissionLevel[]=["SUPER_ADMIN","ADMIN","EDITOR","VIEWER","INSTRUCTOR_PORTAL"];
export async function approveUserAction(formData:FormData){const me=await requireActiveProfile();if(!isSuperAdmin(me))throw new Error("Forbidden");const id=String(formData.get("id")||"");const supabase=await createClient();const{error}=await supabase.from("profiles").update({account_status:"ACTIVE",approved_by:me.id,approved_at:new Date().toISOString()}).eq("id",id);if(error)throw error;revalidatePath("/settings/users");}
export async function configureUserAction(formData:FormData){const me=await requireActiveProfile();if(!isSuperAdmin(me))throw new Error("Forbidden");const id=String(formData.get("id")||"");const job=String(formData.get("job_role")||"") as JobRole;const permission=String(formData.get("permission_level")||"") as PermissionLevel;if(!jobs.includes(job)||!permissions.includes(permission))throw new Error("Invalid role");if(permission==="INSTRUCTOR_PORTAL"&&job!=="INSTRUCTOR")throw new Error("강사 포털 권한은 강사 직무에만 설정할 수 있습니다.");const supabase=await createClient();const{error}=await supabase.from("profiles").update({job_role:job,permission_level:permission}).eq("id",id);if(error)throw error;revalidatePath("/settings/users");revalidatePath("/instructors");}
