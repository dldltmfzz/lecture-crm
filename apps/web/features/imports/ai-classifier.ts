import type { ImportClassification, ImportRow } from "@aileaders/domain";
import { serverEnv } from "@/lib/env";
import { importClassifierInternals, mergeAiClassification } from "@/features/imports/classifier";

interface AiItem {
  row_id: string;
  result: ImportClassification["result"];
  lead_status: ImportClassification["lead_status"];
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_reason: string | null;
  follow_up_priority: ImportClassification["follow_up_priority"];
  summary: string;
  signals: string[];
  confidence: number;
  needs_review: boolean;
}

export async function classifyRowsWithAi(rows: ImportRow[]): Promise<Map<string, ImportClassification>> {
  const env = serverEnv();
  if (!env.AI_API_KEY || rows.length === 0) return new Map();

  const results = new Map<string, ImportClassification>();
  for (let start = 0; start < rows.length; start += 35) {
    const chunk = rows.slice(start, start + 35);
    const payload = chunk.map((row) => ({
      row_id: row.id,
      note: redactLegacyNote(row.normalized_data.legacy_note ?? "", row.normalized_data.name),
      sheet_kind: row.sheet_kind,
      origin_date: row.normalized_data.origin_attendance_date,
      offered_date: row.normalized_data.offered_date,
      // Do not send rule-generated free text because its summary can contain the original Legacy note.
      // Only the non-identifying structured signals are needed as AI context.
      rules_result: {
        result: row.classification_data.result,
        lead_status: row.classification_data.lead_status,
        follow_up_required: row.classification_data.follow_up_required,
        follow_up_date: row.classification_data.follow_up_at?.slice(0, 10) ?? null,
        follow_up_priority: row.classification_data.follow_up_priority,
        signals: row.classification_data.signals,
        confidence: row.classification_data.confidence,
        needs_review: row.classification_data.needs_review,
      },
    }));

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model: env.AI_CLASSIFIER_MODEL ?? "gpt-5.6-luna",
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "Classify Korean legacy CRM notes for migration. Do not invent facts or exact dates. If the note only says late month/early month/next week, set follow_up_date=null and needs_review=true. Preserve uncertainty. Never infer sensitive traits. Return only the required structured output.",
        input: JSON.stringify(payload),
        text: {
          format: {
            type: "json_schema",
            name: "legacy_crm_classification",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      row_id: { type: "string" },
                      result: { type: "string", enum: ["CONNECTED","NO_ANSWER","CALLBACK","CONSIDERING","PAYMENT_PROMISED","NOT_INTERESTED","SCHEDULE_CONFLICT","PRICE_OBJECTION","INVALID_NUMBER","INFO_SENT","OTHER"] },
                      lead_status: { type: "string", enum: ["NEW","CONTACTING","CONSULTED","PAYMENT_PENDING","PAID","COMPLETED","CANCELLED","REFUNDED","LOST"] },
                      follow_up_required: { type: "boolean" },
                      follow_up_date: { type: ["string", "null"] },
                      follow_up_reason: { type: ["string", "null"] },
                      follow_up_priority: { type: "string", enum: ["HIGH","NORMAL","LOW"] },
                      summary: { type: "string" },
                      signals: { type: "array", items: { type: "string" } },
                      confidence: { type: "number", minimum: 0, maximum: 1 },
                      needs_review: { type: "boolean" }
                    },
                    required: ["row_id","result","lead_status","follow_up_required","follow_up_date","follow_up_reason","follow_up_priority","summary","signals","confidence","needs_review"]
                  }
                }
              },
              required: ["items"]
            }
          }
        }
      }),
    });

    if (!response.ok) throw new Error(`AI_CLASSIFICATION_FAILED:${response.status}`);
    const body = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const outputText = body.output_text ?? body.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("AI_CLASSIFICATION_EMPTY");

    const parsed = JSON.parse(outputText) as { items: AiItem[] };
    for (const item of parsed.items) {
      const row = chunk.find((candidate) => candidate.id === item.row_id);
      if (!row) continue;
      const verifiedDate = importClassifierInternals.extractExactFollowUpDate(row.normalized_data.legacy_note ?? "");
      const proposedFollowUpAt = normalizeAiFollowUpDate(item.follow_up_date);
      const proposedDate = proposedFollowUpAt?.slice(0, 10) ?? null;
      // An AI-proposed date is accepted only when the deterministic parser can point to the
      // same exact date in the Legacy note. Otherwise the date remains unresolved for review.
      const verifiedAiFollowUpAt = proposedDate && verifiedDate === proposedDate ? proposedFollowUpAt : null;
      const followUpAt = row.classification_data.follow_up_at ?? verifiedAiFollowUpAt;
      const followUpRequired = row.classification_data.follow_up_required || item.follow_up_required;
      results.set(
        row.id,
        mergeAiClassification(row.classification_data, {
          result: item.result,
          lead_status: item.lead_status,
          follow_up_required: followUpRequired,
          follow_up_at: followUpAt,
          follow_up_reason: item.follow_up_reason?.slice(0, 500) ?? null,
          follow_up_priority: item.follow_up_priority,
          summary: item.summary.slice(0, 500),
          signals: item.signals.slice(0, 30).map((signal) => signal.slice(0, 80)),
          confidence: item.confidence,
          needs_review: item.needs_review || (followUpRequired && !followUpAt),
        }),
      );
    }
  }
  return results;
}

function normalizeAiFollowUpDate(value: string | null) {
  if (!value) return null;
  const match = value.match(/^(20\d{2})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  return `${value}T10:00:00+09:00`;
}

function redactLegacyNote(value: string, customerName: string) {
  let redacted = value.replace(/(?:\+?82[-.\s]?)?0?1[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/g, "[PHONE]");
  redacted = redacted.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]");
  const name = customerName.trim();
  if (name.length >= 2) redacted = redacted.split(name).join("[CUSTOMER]");
  return redacted;
}
