"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ImportClassification, ImportRow } from "@aileaders/domain";
import { isValidKoreanPhone, normalizeKoreanPhone } from "@aileaders/utils";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canManageImports } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { parseLegacyWorkbook } from "@/features/imports/parser";
import { classifyLegacyRow } from "@/features/imports/classifier";
import { classifyRowsWithAi } from "@/features/imports/ai-classifier";

export type ImportActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const reviewSchema = z.object({
  rowId: z.uuid(),
  batchId: z.uuid(),
  reviewStatus: z.enum(["PENDING", "APPROVED", "SKIPPED"]),
  normalized: z.object({
    name: z.string().trim().max(80),
    phone: z.string().trim().max(30),
    region: z.string().trim().max(80).nullable(),
  }),
  classification: z.object({
    result: z.enum(["CONNECTED","NO_ANSWER","CALLBACK","CONSIDERING","PAYMENT_PROMISED","NOT_INTERESTED","SCHEDULE_CONFLICT","PRICE_OBJECTION","INVALID_NUMBER","INFO_SENT","OTHER"]),
    lead_status: z.enum(["NEW","CONTACTING","CONSULTED","PAYMENT_PENDING","PAID","COMPLETED","CANCELLED","REFUNDED","LOST"]),
    follow_up_required: z.boolean(),
    follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidYmd, "Invalid date").nullable(),
    follow_up_reason: z.string().trim().max(500).nullable(),
    follow_up_priority: z.enum(["HIGH","NORMAL","LOW"]),
    summary: z.string().trim().max(500),
    signals: z.array(z.string()).max(30),
    confidence: z.number().min(0).max(1),
    needs_review: z.boolean(),
  }),
}).superRefine((value, context) => {
  if (value.reviewStatus !== "APPROVED") return;
  if (value.normalized.name.length < 2 || /^[-–—_]+$/.test(value.normalized.name)) {
    context.addIssue({ code: "custom", path: ["normalized", "name"], message: "Valid name required" });
  }
  if (!value.normalized.phone) {
    context.addIssue({ code: "custom", path: ["normalized", "phone"], message: "Phone required" });
  }
});

async function requireImportManager() {
  const profile = await requireActiveProfile();
  if (!canManageImports(profile)) throw new Error("PERMISSION_DENIED");
  return profile;
}

export async function uploadImportWorkbookAction(formData: FormData): Promise<void> {
  const profile = await requireImportManager();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("IMPORT_FILE_REQUIRED");
  if (!/\.xlsx$/i.test(file.name)) throw new Error("ONLY_XLSX_FILES_ALLOWED");
  if (file.size > 10 * 1024 * 1024) throw new Error("IMPORT_FILE_TOO_LARGE");

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > 10 * 1024 * 1024) throw new Error("IMPORT_FILE_TOO_LARGE");
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const supabase = await createClient();
  const { data: existingBatch, error: duplicateBatchError } = await supabase
    .from("import_batches")
    .select("id,status")
    .eq("file_sha256", sha256)
    .neq("status", "FAILED")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (duplicateBatchError) throw new Error(`IMPORT_DUPLICATE_CHECK_FAILED:${duplicateBatchError.message}`);
  if (existingBatch) redirect(`/settings/import?batch=${existingBatch.id}`);

  const batchId = randomUUID();
  const storagePath = `${profile.id}/${batchId}/${sanitizeFileName(file.name)}`;

  const { error: batchError } = await supabase.from("import_batches").insert({
    id: batchId,
    file_name: file.name,
    storage_path: storagePath,
    file_sha256: sha256,
    status: "UPLOADED",
    source_label: "AILeaders legacy workbook",
    created_by: profile.id,
  });
  if (batchError) {
    if (batchError.code === "23505") {
      const { data: racedBatch } = await supabase
        .from("import_batches")
        .select("id")
        .eq("file_sha256", sha256)
        .neq("status", "FAILED")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (racedBatch?.id) redirect(`/settings/import?batch=${racedBatch.id}`);
    }
    throw new Error(`IMPORT_BATCH_CREATE_FAILED:${batchError.message}`);
  }

  try {
    const { error: uploadError } = await supabase.storage.from("imports").upload(storagePath, buffer, {
      // The extension is validated above. Force the canonical MIME type because some browsers
      // submit valid .xlsx files as application/octet-stream, which the private bucket rejects.
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: false,
    });
    if (uploadError) throw new Error(`IMPORT_STORAGE_FAILED:${uploadError.message}`);

    const parsed = await parseLegacyWorkbook(buffer);
    const validPhones = [...new Set(parsed.rows.map((row) => row.normalized.phone_normalized).filter((value): value is string => Boolean(value)))];
    const existingByPhone = await findExistingCustomers(validPhones);
    const firstRowByPhone = new Map<string, { id: string; name: string }>();

    const stagedRows = parsed.rows.map((row) => {
      const id = randomUUID();
      const phone = row.normalized.phone_normalized;
      const classification = classifyLegacyRow(row.normalized, row.sheetKind);
      const existing = phone ? existingByPhone.get(phone) : null;
      const firstBatch = phone ? firstRowByPhone.get(phone) : undefined;
      if (phone && !firstBatch) firstRowByPhone.set(phone, { id, name: row.normalized.name });

      const invalidPhone = !phone || !isValidKoreanPhone(phone);
      const matchType = invalidPhone ? "INVALID_PHONE" : existing ? "EXISTING" : firstBatch ? "SAME_BATCH" : "NEW";
      const matchedName = existing?.name ?? firstBatch?.name ?? null;
      const nameMismatch = Boolean(matchedName && !samePersonName(matchedName, row.normalized.name));
      const effectiveClassification: ImportClassification = nameMismatch
        ? {
            ...classification,
            signals: [...new Set([...classification.signals, "NAME_MISMATCH"])],
            summary: `${classification.summary} · 동일 연락처의 이름 확인 필요`,
            confidence: Math.min(classification.confidence, 0.7),
            needs_review: true,
          }
        : classification;
      const errorMessage = row.parseErrors.length ? row.parseErrors.join(", ") : null;
      const needsReview = effectiveClassification.needs_review || invalidPhone;
      return {
        id,
        batch_id: batchId,
        sheet_name: row.sheetName,
        sheet_row: row.sheetRow,
        sheet_kind: row.sheetKind,
        raw_data: row.rawData,
        normalized_data: row.normalized,
        classification_data: effectiveClassification,
        review_data: {},
        classification_engine: "RULES",
        classification_confidence: effectiveClassification.confidence,
        match_type: matchType,
        matched_customer_id: existing?.id ?? null,
        batch_duplicate_of: !existing && firstBatch ? firstBatch.id : null,
        match_context: matchedName ? { matched_name: matchedName } : {},
        status: invalidPhone || errorMessage ? "ERROR" : needsReview ? "NEEDS_REVIEW" : "READY",
        review_status: "PENDING",
        error_message: errorMessage,
      };
    });

    for (const chunk of chunks(stagedRows, 150)) {
      const { error } = await supabase.from("import_rows").insert(chunk);
      if (error) throw new Error(`IMPORT_ROWS_STAGE_FAILED:${error.message}`);
    }

    const counts = countRows(stagedRows);
    const { error: finishError } = await supabase
      .from("import_batches")
      .update({
        status: "REVIEW",
        sheet_count: parsed.sheetCount,
        total_rows: stagedRows.length,
        ready_rows: counts.ready,
        needs_review_rows: counts.review,
        error_rows: counts.error,
        error_message: parsed.skippedSheets.length ? `Skipped sheets: ${parsed.skippedSheets.join(", ")}` : null,
      })
      .eq("id", batchId);
    if (finishError) throw new Error(`IMPORT_BATCH_FINALIZE_FAILED:${finishError.message}`);
  } catch (error) {
    await supabase.from("import_batches").update({ status: "FAILED", error_message: errorMessage(error) }).eq("id", batchId);
    throw error;
  }

  redirect(`/settings/import?batch=${batchId}`);
}

export async function runAiClassificationAction(batchId: string): Promise<ImportActionResult<{ classified: number }>> {
  await requireImportManager();
  const supabase = await createClient();
  await supabase.from("import_batches").update({ status: "CLASSIFYING" }).eq("id", batchId);

  const { data, error } = await supabase
    .from("import_rows")
    .select("*")
    .eq("batch_id", batchId)
    .eq("review_status", "PENDING")
    .in("status", ["READY", "NEEDS_REVIEW"])
    .neq("classification_engine", "MANUAL")
    .limit(1000);
  if (error) {
    await supabase.from("import_batches").update({ status: "REVIEW", error_message: error.message.slice(0, 2000) }).eq("id", batchId);
    return { ok: false, error: `AI 분류 대상을 불러오지 못했습니다. ${error.message}` };
  }

  const candidates = ((data ?? []) as ImportRow[]).filter((row) => Boolean(row.normalized_data.legacy_note?.trim()));
  if (!candidates.length) {
    await supabase.from("import_batches").update({ status: "REVIEW" }).eq("id", batchId);
    return { ok: true, data: { classified: 0 } };
  }

  try {
    const classifications = await classifyRowsWithAi(candidates);
    if (!classifications.size) {
      await supabase.from("import_batches").update({ status: "REVIEW" }).eq("id", batchId);
      return { ok: false, error: "AI_API_KEY가 설정되지 않았습니다. 규칙 기반 분류 결과는 그대로 검수할 수 있습니다." };
    }
    const items = [...classifications.entries()].map(([id, classification]) => ({ id, classification }));
    const { data: applied, error: applyError } = await supabase.rpc("apply_ai_import_classifications", {
      p_batch_id: batchId,
      p_items: items,
    });
    if (applyError) {
      await supabase.from("import_batches").update({ status: "REVIEW", error_message: applyError.message.slice(0, 2000) }).eq("id", batchId);
      return { ok: false, error: `AI 결과 저장에 실패했습니다. ${applyError.message}` };
    }
    revalidateImport(batchId);
    return { ok: true, data: { classified: Number(applied ?? 0) } };
  } catch (error) {
    await supabase.from("import_batches").update({ status: "REVIEW", error_message: errorMessage(error) }).eq("id", batchId);
    return { ok: false, error: `AI 분류에 실패했습니다. ${errorMessage(error)}` };
  }
}

export async function approveReadyRowsAction(batchId: string): Promise<ImportActionResult<{ approved: number }>> {
  await requireImportManager();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_ready_import_rows", { p_batch_id: batchId });
  if (error) return { ok: false, error: `일괄 승인에 실패했습니다. ${error.message}` };
  revalidateImport(batchId);
  return { ok: true, data: { approved: Number(data ?? 0) } };
}

export async function reviewImportRowAction(input: unknown): Promise<ImportActionResult<{ updated: boolean }>> {
  await requireImportManager();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "검수 값을 확인해주세요." };

  const phoneNormalized = normalizeKoreanPhone(parsed.data.normalized.phone);
  if (parsed.data.reviewStatus === "APPROVED" && (!phoneNormalized || !isValidKoreanPhone(phoneNormalized))) {
    return { ok: false, error: "올바른 연락처가 있어야 승인할 수 있습니다." };
  }

  const supabase = await createClient();
  const match = await resolveReviewMatch(parsed.data.batchId, parsed.data.rowId, phoneNormalized);
  const nameMismatch = Boolean(match.matchedName && !samePersonName(match.matchedName, parsed.data.normalized.name));
  const mismatchAlreadyPresented = parsed.data.classification.signals.includes("NAME_MISMATCH");
  if (parsed.data.reviewStatus === "APPROVED" && nameMismatch && !mismatchAlreadyPresented) {
    return { ok: false, error: "동일 연락처에 다른 이름이 연결되어 있습니다. 먼저 수정 저장한 뒤 동일인 여부를 확인해주세요." };
  }
  const followUpAt = parsed.data.classification.follow_up_required && parsed.data.classification.follow_up_date
    ? `${parsed.data.classification.follow_up_date}T10:00:00+09:00`
    : null;

  const signals = nameMismatch
    ? [...new Set([...parsed.data.classification.signals, "NAME_MISMATCH"])]
    : parsed.data.classification.signals.filter((signal) => signal !== "NAME_MISMATCH");

  const classification: ImportClassification = {
    result: parsed.data.classification.result,
    lead_status: parsed.data.classification.lead_status,
    follow_up_required: parsed.data.classification.follow_up_required,
    follow_up_at: followUpAt,
    follow_up_reason: parsed.data.classification.follow_up_reason,
    follow_up_priority: parsed.data.classification.follow_up_priority,
    summary: parsed.data.classification.summary,
    signals,
    confidence: parsed.data.classification.confidence,
    needs_review: nameMismatch || (parsed.data.classification.follow_up_required && !followUpAt) || parsed.data.classification.needs_review,
  };
  const rowStatus = phoneNormalized && isValidKoreanPhone(phoneNormalized)
    ? classification.needs_review ? "NEEDS_REVIEW" : "READY"
    : "ERROR";

  const { data, error } = await supabase.rpc("set_import_row_review", {
    p_row_id: parsed.data.rowId,
    p_review_status: parsed.data.reviewStatus,
    p_review_data: {
      normalized: {
        name: parsed.data.normalized.name,
        phone: parsed.data.normalized.phone,
        phone_normalized: phoneNormalized,
        region: parsed.data.normalized.region,
      },
      classification,
    },
    p_match_type: match.matchType,
    p_matched_customer_id: match.customerId,
    p_batch_duplicate_of: match.batchDuplicateOf,
    p_match_context: match.matchedName ? { matched_name: match.matchedName } : {},
    p_row_status: rowStatus,
    p_error_message: rowStatus === "ERROR" ? "INVALID_PHONE" : null,
  });
  if (error) {
    if (error.message.includes("FOLLOW_UP_DATE_REQUIRED")) return { ok: false, error: "재연락이 필요하면 정확한 재연락 날짜를 입력해주세요." };
    return { ok: false, error: `검수 저장에 실패했습니다. ${error.message}` };
  }
  revalidateImport(parsed.data.batchId);
  return { ok: true, data: { updated: Boolean(data) } };
}

export async function commitImportBatchAction(batchId: string): Promise<ImportActionResult<{ imported: number; failed: number }>> {
  await requireImportManager();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("commit_import_batch", { p_batch_id: batchId });
  if (error) {
    await supabase
      .from("import_batches")
      .update({ status: "REVIEW", error_message: error.message.slice(0, 2000) })
      .eq("id", batchId);
    revalidateImport(batchId);
    return { ok: false, error: `최종 Import에 실패했습니다. ${error.message}` };
  }
  const result = data as { imported_rows?: number; failed_rows?: number } | null;
  revalidateImport(batchId);
  revalidatePath("/customers");
  revalidatePath("/customers/follow-up");
  revalidatePath("/home");
  return { ok: true, data: { imported: result?.imported_rows ?? 0, failed: result?.failed_rows ?? 0 } };
}

async function findExistingCustomers(phones: string[]) {
  const supabase = await createClient();
  const result = new Map<string, { id: string; name: string }>();
  for (const chunk of chunks(phones, 100)) {
    const { data, error } = await supabase
      .from("customers")
      .select("id,name,phone_normalized")
      .in("phone_normalized", chunk)
      .is("deleted_at", null);
    if (error) throw new Error(`EXISTING_CUSTOMER_LOOKUP_FAILED:${error.message}`);
    for (const row of data ?? []) result.set(row.phone_normalized as string, { id: row.id as string, name: row.name as string });
  }
  return result;
}

async function resolveReviewMatch(batchId: string, rowId: string, phone: string | null) {
  if (!phone || !isValidKoreanPhone(phone)) return { matchType: "INVALID_PHONE", customerId: null, batchDuplicateOf: null, matchedName: null } as const;
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id,name")
    .eq("phone_normalized", phone)
    .is("deleted_at", null)
    .maybeSingle();
  if (customer) return { matchType: "EXISTING", customerId: customer.id as string, batchDuplicateOf: null, matchedName: customer.name as string } as const;

  const { data: batchRows, error: batchRowsError } = await supabase
    .from("import_rows")
    .select("id,normalized_data,review_data,sheet_name,sheet_row")
    .eq("batch_id", batchId)
    .neq("id", rowId)
    .order("sheet_name", { ascending: true })
    .order("sheet_row", { ascending: true })
    .limit(2000);
  if (batchRowsError) throw new Error(`IMPORT_DUPLICATE_LOOKUP_FAILED:${batchRowsError.message}`);
  const duplicate = (batchRows ?? []).find((candidate) => {
    const normalized = candidate.normalized_data as { phone_normalized?: string | null };
    const review = candidate.review_data as { normalized?: { phone_normalized?: string | null } };
    return (review.normalized?.phone_normalized ?? normalized.phone_normalized) === phone;
  });
  return duplicate
    ? {
        matchType: "SAME_BATCH",
        customerId: null,
        batchDuplicateOf: duplicate.id as string,
        matchedName: ((duplicate.review_data as { normalized?: { name?: string } }).normalized?.name ?? (duplicate.normalized_data as { name?: string }).name ?? null),
      } as const
    : { matchType: "NEW", customerId: null, batchDuplicateOf: null, matchedName: null } as const;
}

function samePersonName(left: string, right: string) {
  const normalize = (value: string) => value.replace(/\s+/g, "").toLocaleLowerCase("ko-KR");
  return normalize(left) === normalize(right);
}

function isValidYmd(value: string) {
  const match = value.match(/^(20\d{2})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._()\-가-힣]/g, "_").slice(0, 160);
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function countRows(rows: Array<{ status: string }>) {
  return {
    ready: rows.filter((row) => row.status === "READY").length,
    review: rows.filter((row) => row.status === "NEEDS_REVIEW").length,
    error: rows.filter((row) => row.status === "ERROR").length,
  };
}

function revalidateImport(batchId: string) {
  revalidatePath("/settings/import");
  revalidatePath(`/settings/import?batch=${batchId}`);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
