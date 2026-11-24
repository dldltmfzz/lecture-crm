"use server";

import { revalidatePath } from "next/cache";
import {
  instructorAssignmentRequestSchema,
  instructorAssignmentResponseInputSchema,
  instructorAvailabilityInputSchema,
  instructorInputSchema,
} from "@aileaders/validation";
import type { InstructorCandidate } from "@aileaders/domain";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canEditOperations, isInstructorPortal } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getInstructorCandidates } from "@/features/instructors/queries";

export type InstructorActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
const nil = (v: string | undefined) => v?.trim() ? v.trim() : null;
const seoulIso = (value: string) => /([zZ]|[+-]\d{2}:\d{2})$/.test(value) ? new Date(value).toISOString() : new Date(`${value}:00+09:00`).toISOString();

async function requireEditor() { const p = await requireActiveProfile(); if (!canEditOperations(p)) throw new Error("PERMISSION_DENIED"); return p; }
async function requireInstructorPortal() { const p = await requireActiveProfile(); if (!isInstructorPortal(p)) throw new Error("PERMISSION_DENIED"); return p; }

function instructorError(message: string) {
  const map: Record<string,string> = {
    PERMISSION_DENIED:"권한이 없습니다.", PROFILE_NOT_INSTRUCTOR_PORTAL:"연결할 계정은 강사 직무 + INSTRUCTOR_PORTAL 권한이어야 합니다.", PROFILE_NOT_FOUND:"연결할 로그인 계정을 찾을 수 없습니다.",
    INSTRUCTOR_PROFILE_NOT_LINKED:"강사 계정이 강사 프로필과 연결되지 않았습니다.", INSTRUCTOR_NOT_ACTIVE:"활동 중인 강사가 아닙니다.",
    COURSE_NOT_ASSIGNABLE:"취소되었거나 배정할 수 없는 강의입니다.", INSTRUCTOR_SCHEDULE_CONFLICT:"이미 확정된 다른 강의와 시간이 겹칩니다.",
    INSTRUCTOR_UNAVAILABLE:"강사가 해당 시간을 불가능으로 표시했습니다.", PRIMARY_ALREADY_CONFIRMED:"이미 주강사가 확정된 강의입니다.", ASSIGNMENT_ALREADY_CONFIRMED:"이미 이 강사로 확정된 강의입니다.", ACCOUNT_LINK_PERMISSION_DENIED:"강사 로그인 계정 연결/해제는 ADMIN 이상 권한이 필요합니다.",
    ASSIGNMENT_NOT_PENDING:"현재 응답할 수 있는 배정 요청이 아닙니다.", INSTRUCTOR_RESPONSE_REQUIRED:"강사가 먼저 ‘가능’으로 응답해야 최종 확정할 수 있습니다.",
    AVAILABILITY_OVERLAP:"이미 등록된 가능/불가능 시간과 겹칩니다. 기존 일정을 수정하거나 삭제해주세요.", CONFIRMED_ASSIGNMENT_OVERLAP:"확정 강의 시간에는 불가능 일정을 등록할 수 없습니다.",
  };
  return Object.entries(map).find(([key])=>message.includes(key))?.[1] ?? message;
}

export async function saveInstructorAction(input: unknown): Promise<InstructorActionResult<{ instructorId: string }>> {
  await requireEditor();
  const parsed = instructorInputSchema.safeParse(input);
  if (!parsed.success) return { ok:false,error:"강사 정보를 확인해주세요.",fieldErrors:parsed.error.flatten().fieldErrors };
  const v=parsed.data; const supabase=await createClient();
  const params={p_name:v.name,p_phone:nil(v.phone),p_email:nil(v.email),p_stage:v.stage,p_active_status:v.active_status,p_home_region:nil(v.home_region),p_available_regions:v.available_regions,p_specialties:v.specialties,p_lecture_types:v.lecture_types,p_base_fee:v.base_fee,p_memo:nil(v.memo),p_user_id:v.user_id||null};
  const result=v.instructor_id
    ? await supabase.rpc("update_instructor",{p_instructor_id:v.instructor_id,...params})
    : await supabase.rpc("create_instructor",params);
  if(result.error) return {ok:false,error:`강사 저장에 실패했습니다. ${instructorError(result.error.message)}`};
  revalidatePath("/instructors"); revalidatePath("/instructors/availability");
  return {ok:true,data:{instructorId:v.instructor_id||String(result.data)}};
}

export async function setInstructorAvailabilityAction(input: unknown): Promise<InstructorActionResult<{ availabilityId:string }>> {
  const profile=await requireActiveProfile();
  if(!canEditOperations(profile)&&!isInstructorPortal(profile)) return {ok:false,error:"권한이 없습니다."};
  const parsed=instructorAvailabilityInputSchema.safeParse(input);
  if(!parsed.success) return {ok:false,error:"일정 정보를 확인해주세요.",fieldErrors:parsed.error.flatten().fieldErrors};
  const v=parsed.data; const supabase=await createClient();
  const {data,error}=await supabase.rpc("set_instructor_availability",{p_start_at:seoulIso(v.start_at),p_end_at:seoulIso(v.end_at),p_status:v.status,p_reason:nil(v.reason),p_instructor_id:v.instructor_id||null});
  if(error) return {ok:false,error:`일정 저장에 실패했습니다. ${instructorError(error.message)}`};
  revalidatePath("/instructors/availability"); revalidatePath("/instructor/availability"); revalidatePath("/instructor/home");
  return {ok:true,data:{availabilityId:String(data)}};
}

export async function deleteInstructorAvailabilityAction(availabilityId:string):Promise<InstructorActionResult<{deleted:boolean}>>{
  const profile=await requireActiveProfile(); if(!canEditOperations(profile)&&!isInstructorPortal(profile)) return {ok:false,error:"권한이 없습니다."};
  const supabase=await createClient(); const {data,error}=await supabase.rpc("delete_instructor_availability",{p_availability_id:availabilityId});
  if(error) return {ok:false,error:`일정 삭제에 실패했습니다. ${instructorError(error.message)}`};
  revalidatePath("/instructors/availability"); revalidatePath("/instructor/availability");
  return {ok:true,data:{deleted:Boolean(data)}};
}

export async function getInstructorCandidatesAction(courseId:string):Promise<InstructorActionResult<InstructorCandidate[]>>{
  await requireEditor(); try{return {ok:true,data:await getInstructorCandidates(courseId)}}catch(error){return {ok:false,error:instructorError(error instanceof Error?error.message:"후보 조회에 실패했습니다.")};}
}

export async function requestInstructorAssignmentAction(input:unknown):Promise<InstructorActionResult<{assignmentId:string}>>{
  await requireEditor(); const parsed=instructorAssignmentRequestSchema.safeParse(input); if(!parsed.success)return{ok:false,error:"배정 요청 정보를 확인해주세요."};
  const v=parsed.data; const supabase=await createClient(); const {data,error}=await supabase.rpc("request_instructor_assignment",{p_course_id:v.course_id,p_instructor_id:v.instructor_id,p_role:v.role,p_fee:v.fee,p_memo:nil(v.memo)});
  if(error)return{ok:false,error:`배정 요청에 실패했습니다. ${instructorError(error.message)}`};
  revalidatePath("/instructors");revalidatePath("/instructors/free-class-board");revalidatePath("/instructor/home");
  return{ok:true,data:{assignmentId:String(data)}};
}

export async function respondInstructorAssignmentAction(input:unknown):Promise<InstructorActionResult<{updated:boolean}>>{
  await requireInstructorPortal(); const parsed=instructorAssignmentResponseInputSchema.safeParse(input); if(!parsed.success)return{ok:false,error:"응답 정보를 확인해주세요."};
  const v=parsed.data; const supabase=await createClient(); const {data,error}=await supabase.rpc("respond_instructor_assignment",{p_assignment_id:v.assignment_id,p_response:v.response,p_note:nil(v.note)});
  if(error)return{ok:false,error:`응답 저장에 실패했습니다. ${instructorError(error.message)}`};
  revalidatePath("/instructor/home");revalidatePath("/instructor/schedule");revalidatePath("/instructor/classes");revalidatePath("/instructors/free-class-board");
  return{ok:true,data:{updated:Boolean(data)}};
}

export async function confirmInstructorAssignmentAction(assignmentId:string):Promise<InstructorActionResult<{updated:boolean}>>{
  await requireEditor(); const supabase=await createClient(); const {data,error}=await supabase.rpc("confirm_instructor_assignment",{p_assignment_id:assignmentId});
  if(error)return{ok:false,error:`최종 배정에 실패했습니다. ${instructorError(error.message)}`};
  revalidatePath("/instructors");revalidatePath("/instructors/free-class-board");revalidatePath("/programs");revalidatePath("/instructor/home");revalidatePath("/instructor/schedule");
  return{ok:true,data:{updated:Boolean(data)}};
}

export async function cancelInstructorAssignmentAction(assignmentId:string,reason=""):Promise<InstructorActionResult<{updated:boolean}>>{
  await requireEditor(); const supabase=await createClient(); const {data,error}=await supabase.rpc("cancel_instructor_assignment",{p_assignment_id:assignmentId,p_reason:nil(reason)});
  if(error)return{ok:false,error:`배정 취소에 실패했습니다. ${instructorError(error.message)}`};
  revalidatePath("/instructors");revalidatePath("/instructors/free-class-board");revalidatePath("/programs");revalidatePath("/instructor/home");revalidatePath("/instructor/schedule");
  return{ok:true,data:{updated:Boolean(data)}};
}
