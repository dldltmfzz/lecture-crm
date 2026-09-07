"use server";

import { revalidatePath } from "next/cache";
import type { CustomerDetail, LeadStatus } from "@aileaders/domain";
import { createCustomerSchema, createLeadSchema, leadStatusSchema, recordConsultationSchema } from "@aileaders/validation";
import { formatKoreanPhone, isValidKoreanPhone, normalizeKoreanPhone } from "@aileaders/utils";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canEditOperations } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getCustomerDetail } from "@/features/customers/queries";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

function nullable(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

function seoulLocalToIso(value: string | undefined): string | null {
  if (!value) return null;
  if (/([zZ]|[+-]\d{2}:\d{2})$/.test(value)) return new Date(value).toISOString();
  return new Date(`${value}:00+09:00`).toISOString();
}

function dateOrNull(value: string | undefined): string | null {
  return value?.trim() ? value : null;
}

async function requireEditor() {
  const profile = await requireActiveProfile();
  if (!canEditOperations(profile)) throw new Error("PERMISSION_DENIED");
  return profile;
}

export async function checkPhoneDuplicateAction(rawPhone: string): Promise<ActionResult<{ customerId: string; name: string; phone: string } | null>> {
  await requireActiveProfile();
  const phone = normalizeKoreanPhone(rawPhone);
  if (!phone || !isValidKoreanPhone(phone)) return { ok: true, data: null };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id,name,phone")
    .eq("phone_normalized", phone)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return { ok: false, error: "중복 확인 중 오류가 발생했습니다." };
  if (!data) return { ok: true, data: null };
  return { ok: true, data: { customerId: data.id as string, name: data.name as string, phone: formatKoreanPhone(data.phone as string) } };
}

export async function createCustomerAction(input: unknown): Promise<ActionResult<{ customerId: string; leadId: string } | { duplicateCustomerId: string }>> {
  await requireEditor();
  const parsed = createCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "입력값을 확인해주세요.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (!isValidKoreanPhone(parsed.data.phone)) {
    return { ok: false, error: "올바른 연락처를 입력해주세요.", fieldErrors: { phone: ["010-0000-0000 형식의 연락처를 입력해주세요."] } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_customer_with_lead", {
    p_name: parsed.data.name,
    p_phone: parsed.data.phone,
    p_email: nullable(parsed.data.email),
    p_region: nullable(parsed.data.region),
    p_source_type: parsed.data.source_type,
    p_source_detail: nullable(parsed.data.source_detail),
    p_customer_type: parsed.data.customer_type,
    p_memo: nullable(parsed.data.memo),
    p_origin_instructor_name: nullable(parsed.data.origin_instructor_name),
    p_origin_course_name: nullable(parsed.data.origin_course_name),
    p_origin_attendance_date: dateOrNull(parsed.data.origin_attendance_date),
    p_origin_region: nullable(parsed.data.origin_region),
    p_offered_course_name: nullable(parsed.data.offered_course_name),
    p_offered_region: nullable(parsed.data.offered_region),
    p_offered_date: dateOrNull(parsed.data.offered_date),
  });

  if (error) {
    if (error.message.includes("INVALID_PHONE")) return { ok: false, error: "올바른 연락처를 입력해주세요." };
    if (error.code === "23505") {
      const duplicate = await checkPhoneDuplicateAction(parsed.data.phone);
      if (duplicate.ok && duplicate.data) return { ok: true, data: { duplicateCustomerId: duplicate.data.customerId } };
    }
    return { ok: false, error: `고객 등록에 실패했습니다. ${error.message}` };
  }

  const payload = data as { status?: string; customer_id?: string; lead_id?: string } | null;
  if (payload?.status === "duplicate" && payload.customer_id) {
    return { ok: true, data: { duplicateCustomerId: payload.customer_id } };
  }
  if (!payload?.customer_id || !payload.lead_id) return { ok: false, error: "고객 등록 결과를 확인할 수 없습니다." };

  revalidatePath("/customers");
  revalidatePath("/customers/follow-up");
  return { ok: true, data: { customerId: payload.customer_id, leadId: payload.lead_id } };
}


export async function createLeadAction(input: unknown): Promise<ActionResult<{ leadId: string }>> {
  await requireEditor();
  const parsed = createLeadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "관심 과정 정보를 확인해주세요.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_lead_for_customer", {
    p_customer_id: parsed.data.customer_id,
    p_source_type: parsed.data.source_type,
    p_source_detail: nullable(parsed.data.source_detail),
    p_origin_instructor_name: nullable(parsed.data.origin_instructor_name),
    p_origin_course_name: nullable(parsed.data.origin_course_name),
    p_origin_attendance_date: dateOrNull(parsed.data.origin_attendance_date),
    p_origin_region: nullable(parsed.data.origin_region),
    p_offered_course_name: nullable(parsed.data.offered_course_name),
    p_offered_region: nullable(parsed.data.offered_region),
    p_offered_date: dateOrNull(parsed.data.offered_date),
    p_legacy_note: nullable(parsed.data.legacy_note),
  });
  if (error) return { ok: false, error: `관심 과정 추가에 실패했습니다. ${error.message}` };
  if (!data) return { ok: false, error: "관심 과정 생성 결과를 확인할 수 없습니다." };
  revalidatePath("/customers");
  revalidatePath("/customers/follow-up");
  return { ok: true, data: { leadId: String(data) } };
}

export async function recordConsultationAction(input: unknown): Promise<ActionResult<{ consultationId: string; contactRound: number }>> {
  await requireEditor();
  const parsed = recordConsultationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "상담 기록을 확인해주세요.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_consultation", {
    p_customer_id: parsed.data.customer_id,
    p_lead_id: parsed.data.lead_id || null,
    p_contact_type: parsed.data.contact_type,
    p_result: parsed.data.result,
    p_note: nullable(parsed.data.note),
    p_follow_up_required: parsed.data.follow_up_required,
    p_follow_up_at: parsed.data.follow_up_required ? seoulLocalToIso(parsed.data.follow_up_at) : null,
    p_follow_up_reason: parsed.data.follow_up_required ? nullable(parsed.data.follow_up_reason) : null,
    p_follow_up_priority: parsed.data.follow_up_priority,
  });

  if (error) return { ok: false, error: `상담 저장에 실패했습니다. ${error.message}` };
  const payload = data as { consultation_id?: string; contact_round?: number } | null;
  if (!payload?.consultation_id) return { ok: false, error: "상담 저장 결과를 확인할 수 없습니다." };

  revalidatePath("/customers");
  revalidatePath("/customers/follow-up");
  revalidatePath("/home");
  return { ok: true, data: { consultationId: payload.consultation_id, contactRound: payload.contact_round ?? 1 } };
}

export async function completeFollowUpAction(consultationId: string): Promise<ActionResult<{ completed: boolean }>> {
  await requireEditor();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_follow_up", { p_consultation_id: consultationId });
  if (error) return { ok: false, error: `재연락 완료 처리에 실패했습니다. ${error.message}` };
  revalidatePath("/customers");
  revalidatePath("/customers/follow-up");
  revalidatePath("/home");
  return { ok: true, data: { completed: Boolean(data) } };
}

export async function updateLeadStatusAction(leadId: string, status: LeadStatus): Promise<ActionResult<{ updated: boolean }>> {
  await requireEditor();
  const parsedStatus = leadStatusSchema.safeParse(status);
  if (!parsedStatus.success) return { ok: false, error: "유효하지 않은 상태입니다." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_lead_status", { p_lead_id: leadId, p_status: parsedStatus.data });
  if (error) return { ok: false, error: `상태 변경에 실패했습니다. ${error.message}` };
  revalidatePath("/customers");
  revalidatePath("/customers/follow-up");
  return { ok: true, data: { updated: Boolean(data) } };
}

export async function getCustomerDetailAction(customerId: string): Promise<ActionResult<CustomerDetail | null>> {
  await requireActiveProfile();
  try {
    return { ok: true, data: await getCustomerDetail(customerId) };
  } catch {
    return { ok: false, error: "고객 상세 정보를 불러오지 못했습니다." };
  }
}
