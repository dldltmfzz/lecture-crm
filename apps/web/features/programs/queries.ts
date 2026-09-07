import type { CourseApplicant, CourseChecklistItem, CourseDetail, CourseSession, CourseSummary, CustomerSearchOption, EventRosterRow, LeadStatus, OutstandingPayment, PaymentTransaction } from "@aileaders/domain";
import { createClient } from "@/lib/supabase/server";

function numberValue(value: unknown): number { return typeof value === "number" ? value : Number(value ?? 0); }

export async function getCourseSummaries(): Promise<CourseSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_course_summary").select("*").order("start_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...(row as unknown as CourseSummary),
    capacity: numberValue(row.capacity), base_price: numberValue(row.base_price), applicant_count: numberValue(row.applicant_count),
    paid_count: numberValue(row.paid_count), booked_revenue: numberValue(row.booked_revenue), collected_revenue: numberValue(row.collected_revenue),
    outstanding_amount: numberValue(row.outstanding_amount), onsite_balance_count: numberValue(row.onsite_balance_count), fill_rate: numberValue(row.fill_rate),
    readiness_percent: numberValue(row.readiness_percent), checklist_open_count: numberValue(row.checklist_open_count),
  }));
}

export async function getCourseDetail(courseId: string): Promise<CourseDetail | null> {
  const supabase = await createClient();
  const [{ data: summary, error: summaryError }, { data: course, error: courseError }, { data: sessions, error: sessionsError }, { data: checklist, error: checklistError }, { data: applicants, error: applicantsError }] = await Promise.all([
    supabase.from("v_course_summary").select("*").eq("id", courseId).maybeSingle(),
    supabase.from("courses").select("venue_address,restaurant_address,internal_memo").eq("id", courseId).maybeSingle(),
    supabase.from("course_sessions").select("*").eq("course_id", courseId).order("session_no"),
    supabase.from("course_checklist_items").select("*").eq("course_id", courseId).order("sort_order"),
    supabase.from("v_course_applicants").select("*").eq("course_id", courseId).order("applied_at", { ascending: false }),
  ]);
  const error = summaryError || courseError || sessionsError || checklistError || applicantsError;
  if (error) throw new Error(error.message);
  if (!summary || !course) return null;
  return {
    ...(summary as unknown as CourseSummary),
    capacity: numberValue(summary.capacity), base_price: numberValue(summary.base_price), applicant_count: numberValue(summary.applicant_count),
    paid_count: numberValue(summary.paid_count), booked_revenue: numberValue(summary.booked_revenue), collected_revenue: numberValue(summary.collected_revenue),
    outstanding_amount: numberValue(summary.outstanding_amount), onsite_balance_count: numberValue(summary.onsite_balance_count), fill_rate: numberValue(summary.fill_rate),
    readiness_percent: numberValue(summary.readiness_percent), checklist_open_count: numberValue(summary.checklist_open_count),
    venue_address: course.venue_address as string | null, restaurant_address: course.restaurant_address as string | null, internal_memo: course.internal_memo as string | null,
    sessions: (sessions ?? []) as CourseSession[], checklist: (checklist ?? []) as CourseChecklistItem[],
    applicants: (applicants ?? []).map((row) => ({ ...(row as unknown as CourseApplicant), list_price: numberValue(row.list_price), discount_amount: numberValue(row.discount_amount), final_price: numberValue(row.final_price), gross_paid: numberValue(row.gross_paid), gross_refunded: numberValue(row.gross_refunded), net_paid: numberValue(row.net_paid), outstanding_amount: numberValue(row.outstanding_amount), refund_requested_amount: row.refund_requested_amount == null ? null : numberValue(row.refund_requested_amount) })),
  };
}

export async function searchCustomersForEnrollment(query: string): Promise<CustomerSearchOption[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const supabase = await createClient();
  const digits = q.replace(/\D/g, "");
  let request = supabase.from("customers").select("id,name,phone,region,leads(id,status,offered_course_name,offered_region)").is("deleted_at", null).limit(12);
  request = digits.length >= 3 ? request.ilike("phone_normalized", `%${digits}%`) : request.ilike("name", `%${q}%`);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(row.id), name: String(row.name), phone: String(row.phone), region: row.region ? String(row.region) : null,
    leads: ((row.leads ?? []) as Array<{id:string;status:LeadStatus;offered_course_name:string|null;offered_region:string|null}>).map((lead) => ({ id: lead.id, status: lead.status, offered_course_name: lead.offered_course_name, offered_region: lead.offered_region })),
  }));
}


export async function getCoursePaymentTransactions(courseId: string): Promise<PaymentTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_course_payment_transactions").select("*").eq("course_id", courseId).order("paid_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...(row as unknown as PaymentTransaction), amount: numberValue(row.amount) }));
}

export async function getCourseEventRoster(courseId: string, sessionId?: string): Promise<EventRosterRow[]> {
  const supabase = await createClient();
  let request = supabase.from("v_course_event_roster").select("*").eq("course_id", courseId).order("customer_name");
  if (sessionId) request = request.eq("session_id", sessionId);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...(row as unknown as EventRosterRow),
    final_price: numberValue(row.final_price), gross_paid: numberValue(row.gross_paid), gross_refunded: numberValue(row.gross_refunded),
    net_paid: numberValue(row.net_paid), outstanding_amount: numberValue(row.outstanding_amount), session_no: numberValue(row.session_no),
  }));
}

export async function getOutstandingPayments(): Promise<OutstandingPayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_outstanding_payments").select("*").order("is_overdue", { ascending: false }).order("payment_due_at", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...(row as unknown as OutstandingPayment),
    final_price: numberValue(row.final_price), gross_paid: numberValue(row.gross_paid), gross_refunded: numberValue(row.gross_refunded),
    net_paid: numberValue(row.net_paid), outstanding_amount: numberValue(row.outstanding_amount), transaction_count: numberValue(row.transaction_count),
    refund_requested_amount: row.refund_requested_amount == null ? null : numberValue(row.refund_requested_amount),
  }));
}
