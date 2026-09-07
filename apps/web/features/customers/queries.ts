import type { Customer, CustomerCrmSummary, CustomerDetail, Consultation, FollowUpRow, Lead } from "@aileaders/domain";
import { createClient } from "@/lib/supabase/server";

export async function getCustomerSummaries(): Promise<CustomerCrmSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_customer_crm_summary")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw new Error(`CUSTOMERS_QUERY_FAILED:${error.message}`);
  return (data ?? []) as CustomerCrmSummary[];
}

export async function getFollowUps(): Promise<FollowUpRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_followups_due")
    .select("*")
    .order("follow_up_at", { ascending: true })
    .limit(1000);

  if (error) throw new Error(`FOLLOWUPS_QUERY_FAILED:${error.message}`);
  return (data ?? []) as FollowUpRow[];
}

export async function getCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const supabase = await createClient();
  const [customerResult, leadsResult, consultationsResult] = await Promise.all([
    supabase.from("customers").select("*").eq("id", customerId).is("deleted_at", null).maybeSingle(),
    supabase.from("leads").select("*").eq("customer_id", customerId).order("updated_at", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("consultations").select("*").eq("customer_id", customerId).order("contact_at", { ascending: false, nullsFirst: false }),
  ]);

  if (customerResult.error) throw new Error(`CUSTOMER_QUERY_FAILED:${customerResult.error.message}`);
  if (!customerResult.data) return null;
  if (leadsResult.error) throw new Error(`LEADS_QUERY_FAILED:${leadsResult.error.message}`);
  if (consultationsResult.error) throw new Error(`CONSULTATIONS_QUERY_FAILED:${consultationsResult.error.message}`);

  const leads = ((leadsResult.data ?? []) as Lead[]).sort(compareLeadRecency);

  return {
    customer: customerResult.data as Customer,
    leads,
    consultations: (consultationsResult.data ?? []) as Consultation[],
  };
}

function compareLeadRecency(left: Lead, right: Lead) {
  const leftManual = left.legacy_sheet ? 0 : 1;
  const rightManual = right.legacy_sheet ? 0 : 1;
  if (leftManual !== rightManual) return rightManual - leftManual;
  const delta = leadRecency(right) - leadRecency(left);
  if (delta !== 0) return delta;
  const updated = right.updated_at.localeCompare(left.updated_at);
  return updated !== 0 ? updated : right.id.localeCompare(left.id);
}

function leadRecency(lead: Lead) {
  const value = lead.legacy_sheet
    ? lead.offered_date ?? lead.origin_attendance_date ?? "1900-01-01"
    : lead.updated_at;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
