"use server";

import { revalidatePath } from "next/cache";
import type { CourseType, CustomerSearchOption } from "@aileaders/domain";
import { randomUUID } from "node:crypto";
import { attendanceRecordSchema, checklistUpdateSchema, courseInputSchema, enrollmentInputSchema, paymentDueSchema, paymentRecordSchema, refundRecordSchema, refundRequestSchema } from "@aileaders/validation";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canEditOperations,canManageFinance } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { searchCustomersForEnrollment } from "@/features/programs/queries";

export type ProgramActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
const nil = (value: string | undefined) => value?.trim() ? value.trim() : null;
const seoulIso = (value: string) => /([zZ]|[+-]\d{2}:\d{2})$/.test(value) ? new Date(value).toISOString() : new Date(`${value}:00+09:00`).toISOString();
const coursePrefix: Record<CourseType,string> = {ONE_DAY:"OD",ONLINE:"ON",INSTRUCTOR_TRAINING:"IT",CORPORATE:"CO",EXTERNAL_LECTURE:"EX",FREE_LECTURE:"FR"};
function generatedCourseCode(type:CourseType,startAt:string){const date=startAt.slice(0,10).replaceAll("-","")||"DATE";return `${coursePrefix[type]}-${date}-${randomUUID().slice(0,4).toUpperCase()}`;}

async function requireEditor() { const profile = await requireActiveProfile(); if (!canEditOperations(profile)) throw new Error("PERMISSION_DENIED"); return profile; }
async function requireFinanceManager() { const profile = await requireActiveProfile(); if (!canManageFinance(profile)) throw new Error("FINANCE_PERMISSION_DENIED"); return profile; }

function rpcSessions(sessions: Array<{session_no:number;title:string;start_at:string;end_at:string;meeting_url:string}>) {
  return sessions.map((session) => ({ ...session, start_at: seoulIso(session.start_at), end_at: seoulIso(session.end_at), title: nil(session.title), meeting_url: nil(session.meeting_url) }));
}

export async function createCourseAction(input: unknown): Promise<ProgramActionResult<{ courseId: string }>> {
  await requireEditor();
  const parsed = courseInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "강의 정보를 확인해주세요.", fieldErrors: parsed.error.flatten().fieldErrors };
  const value = parsed.data; const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_course", {
    p_course_code: value.course_code || generatedCourseCode(value.course_type,value.start_at), p_course_type: value.course_type, p_title: value.title, p_region: nil(value.region),
    p_start_at: seoulIso(value.start_at), p_end_at: seoulIso(value.end_at), p_capacity: value.capacity, p_base_price: value.base_price,
    p_status: value.status, p_venue_status: value.venue_status, p_venue_name: nil(value.venue_name), p_venue_address: nil(value.venue_address),
    p_restaurant_status: value.restaurant_status, p_restaurant_name: nil(value.restaurant_name), p_restaurant_address: nil(value.restaurant_address),
    p_expected_attendees: value.expected_attendees, p_internal_memo: nil(value.internal_memo), p_sessions: rpcSessions(value.sessions),
  });
  if (error) return { ok: false, error: error.code === "23505" ? "이미 사용 중인 강의 코드입니다." : `강의 생성에 실패했습니다. ${error.message}` };
  revalidatePath("/programs"); revalidatePath("/home");
  return { ok: true, data: { courseId: String(data) } };
}

export async function updateCourseAction(courseId: string, input: unknown): Promise<ProgramActionResult<{ updated: boolean }>> {
  await requireEditor(); const parsed = courseInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "강의 정보를 확인해주세요.", fieldErrors: parsed.error.flatten().fieldErrors };
  const value = parsed.data; const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_course", {
    p_course_id: courseId,p_title:value.title,p_region:nil(value.region),p_start_at:seoulIso(value.start_at),p_end_at:seoulIso(value.end_at),
    p_capacity:value.capacity,p_base_price:value.base_price,p_status:value.status,p_venue_status:value.venue_status,p_venue_name:nil(value.venue_name),p_venue_address:nil(value.venue_address),
    p_restaurant_status:value.restaurant_status,p_restaurant_name:nil(value.restaurant_name),p_restaurant_address:nil(value.restaurant_address),
    p_expected_attendees:value.expected_attendees,p_internal_memo:nil(value.internal_memo),p_sessions:rpcSessions(value.sessions),
  });
  if (error) return { ok:false,error:`강의 수정에 실패했습니다. ${error.message}` };
  revalidatePath("/programs"); revalidatePath(`/programs/${courseId}`); revalidatePath("/home");
  return { ok:true,data:{updated:Boolean(data)} };
}

export async function createEnrollmentAction(input: unknown): Promise<ProgramActionResult<{ enrollmentId: string }>> {
  await requireEditor(); const parsed = enrollmentInputSchema.safeParse(input);
  if (!parsed.success) return { ok:false,error:"신청자 정보를 확인해주세요.",fieldErrors:parsed.error.flatten().fieldErrors };
  const v=parsed.data; const supabase=await createClient();
  const { data,error }=await supabase.rpc("create_enrollment",{p_course_id:v.course_id,p_customer_id:v.customer_id,p_lead_id:v.lead_id||null,p_application_source:v.application_source,p_list_price:v.list_price,p_discount_amount:v.discount_amount,p_discount_reason:nil(v.discount_reason),p_memo:nil(v.memo)});
  if(error) return {ok:false,error:error.code==="23505"?"이미 이 강의에 등록된 고객입니다.":`신청자 등록에 실패했습니다. ${error.message}`};
  revalidatePath("/programs"); revalidatePath(`/programs/${v.course_id}`); revalidatePath("/customers");
  return {ok:true,data:{enrollmentId:String(data)}};
}

export async function updateChecklistItemAction(courseId: string, input: unknown): Promise<ProgramActionResult<{updated:boolean}>> {
  await requireEditor(); const parsed=checklistUpdateSchema.safeParse(input); if(!parsed.success) return {ok:false,error:"체크리스트 값을 확인해주세요."};
  const supabase=await createClient(); const {data,error}=await supabase.rpc("update_course_checklist_item",{p_item_id:parsed.data.item_id,p_status:parsed.data.status,p_memo:nil(parsed.data.memo)});
  if(error) return {ok:false,error:`체크리스트 저장에 실패했습니다. ${error.message}`};
  revalidatePath("/programs"); revalidatePath(`/programs/${courseId}`); revalidatePath("/home");
  return {ok:true,data:{updated:Boolean(data)}};
}

export async function searchEnrollmentCustomersAction(query: string): Promise<ProgramActionResult<CustomerSearchOption[]>> {
  await requireActiveProfile();
  try { return {ok:true,data:await searchCustomersForEnrollment(query)}; } catch (error) { return {ok:false,error:error instanceof Error?error.message:"고객 검색에 실패했습니다."}; }
}


function paymentError(message: string): string {
  const map: Record<string, string> = {
    PAYMENT_EXCEEDS_FINAL_PRICE: "최종 수강료보다 많이 결제할 수 없습니다.",
    ENROLLMENT_CANCELLED: "취소된 신청에는 결제를 등록할 수 없습니다.",
    REFUND_EXCEEDS_NET_PAID: "현재 실결제액보다 많이 환불할 수 없습니다.",
    OPEN_REFUND_REQUEST_EXISTS: "이미 처리 중인 환불 요청이 있습니다.",
    REFUND_REQUEST_MISMATCH: "환불 요청과 수강 신청 정보가 일치하지 않습니다.",
    REFUND_REQUEST_CLOSED: "이미 종료된 환불 요청입니다.",
    REFUND_EXCEEDS_REQUEST: "요청된 환불금액보다 많이 환불할 수 없습니다.",
    REFUND_AMOUNT_MUST_MATCH_REQUEST: "등록된 환불 요청 금액과 실제 환불 금액이 같아야 합니다.",
    SESSION_ENROLLMENT_COURSE_MISMATCH: "해당 강의의 회차가 아닙니다.",
    FINANCE_PERMISSION_DENIED: "실제 환불 처리는 관리자 또는 회계 권한이 필요합니다.",
  };
  return Object.entries(map).find(([key]) => message.includes(key))?.[1] ?? message;
}

export async function recordPaymentAction(courseId: string, input: unknown): Promise<ProgramActionResult<{ transactionId: string }>> {
  await requireEditor();
  const parsed = paymentRecordSchema.safeParse(input);
  if (!parsed.success) return { ok:false, error:"결제 정보를 확인해주세요.", fieldErrors:parsed.error.flatten().fieldErrors };
  const v=parsed.data; const supabase=await createClient();
  const {data,error}=await supabase.rpc("record_payment",{
    p_enrollment_id:v.enrollment_id,p_payer_name:v.payer_name,p_payment_stage:v.payment_stage,p_payment_method:v.payment_method,
    p_amount:v.amount,p_paid_at:seoulIso(v.paid_at),p_payment_due_at:v.payment_due_at?seoulIso(v.payment_due_at):null,
    p_reference_no:nil(v.reference_no),p_memo:nil(v.memo),
  });
  if(error) return {ok:false,error:`결제 등록에 실패했습니다. ${paymentError(error.message)}`};
  revalidatePath(`/programs/${courseId}`); revalidatePath(`/event/${courseId}`); revalidatePath("/programs"); revalidatePath("/finance"); revalidatePath("/home");
  return {ok:true,data:{transactionId:String(data)}};
}

export async function setPaymentDueAction(courseId: string, input: unknown): Promise<ProgramActionResult<{updated:boolean}>> {
  await requireEditor(); const parsed=paymentDueSchema.safeParse(input);
  if(!parsed.success) return {ok:false,error:"결제 예정일을 확인해주세요."};
  const supabase=await createClient();
  const {data,error}=await supabase.rpc("set_enrollment_payment_due",{p_enrollment_id:parsed.data.enrollment_id,p_payment_due_at:parsed.data.payment_due_at?seoulIso(parsed.data.payment_due_at):null});
  if(error) return {ok:false,error:`결제 예정일 저장에 실패했습니다. ${paymentError(error.message)}`};
  revalidatePath(`/programs/${courseId}`); revalidatePath("/finance"); revalidatePath("/home");
  return {ok:true,data:{updated:Boolean(data)}};
}

export async function requestRefundAction(courseId: string, input: unknown): Promise<ProgramActionResult<{requestId:string}>> {
  await requireEditor(); const parsed=refundRequestSchema.safeParse(input);
  if(!parsed.success) return {ok:false,error:"환불 요청 정보를 확인해주세요.",fieldErrors:parsed.error.flatten().fieldErrors};
  const v=parsed.data; const supabase=await createClient();
  const {data,error}=await supabase.rpc("request_refund",{p_enrollment_id:v.enrollment_id,p_requested_amount:v.requested_amount,p_reason:v.reason,p_cancel_enrollment:v.cancel_enrollment,p_memo:nil(v.memo)});
  if(error) return {ok:false,error:`환불 요청 등록에 실패했습니다. ${paymentError(error.message)}`};
  revalidatePath(`/programs/${courseId}`); revalidatePath("/finance");
  return {ok:true,data:{requestId:String(data)}};
}

export async function recordRefundAction(courseId: string, input: unknown): Promise<ProgramActionResult<{transactionId:string}>> {
  await requireFinanceManager(); const parsed=refundRecordSchema.safeParse(input);
  if(!parsed.success) return {ok:false,error:"환불 처리 정보를 확인해주세요.",fieldErrors:parsed.error.flatten().fieldErrors};
  const v=parsed.data; const supabase=await createClient();
  const {data,error}=await supabase.rpc("record_refund",{p_enrollment_id:v.enrollment_id,p_refund_request_id:v.refund_request_id||null,p_amount:v.amount,p_payment_method:v.payment_method,p_paid_at:seoulIso(v.paid_at),p_cancel_enrollment:v.cancel_enrollment,p_reference_no:nil(v.reference_no),p_memo:nil(v.memo)});
  if(error) return {ok:false,error:`환불 처리에 실패했습니다. ${paymentError(error.message)}`};
  revalidatePath(`/programs/${courseId}`); revalidatePath(`/event/${courseId}`); revalidatePath("/programs"); revalidatePath("/finance"); revalidatePath("/home");
  return {ok:true,data:{transactionId:String(data)}};
}

export async function setAttendanceAction(courseId: string, input: unknown): Promise<ProgramActionResult<{recordId:string}>> {
  await requireEditor(); const parsed=attendanceRecordSchema.safeParse(input);
  if(!parsed.success) return {ok:false,error:"출석 정보를 확인해주세요."};
  const v=parsed.data; const supabase=await createClient();
  const {data,error}=await supabase.rpc("set_attendance",{p_enrollment_id:v.enrollment_id,p_session_id:v.session_id,p_status:v.status,p_note:nil(v.note)});
  if(error) return {ok:false,error:`출석 저장에 실패했습니다. ${paymentError(error.message)}`};
  revalidatePath(`/programs/${courseId}`); revalidatePath(`/event/${courseId}`);
  return {ok:true,data:{recordId:String(data)}};
}
