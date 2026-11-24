import type { ImportClassification, ImportNormalizedRow, ImportRow } from "@aileaders/domain";

export function effectiveNormalized(row: ImportRow): ImportNormalizedRow {
  const merged = { ...row.normalized_data, ...(row.review_data.normalized ?? {}) } as ImportNormalizedRow;
  // Batches staged by an earlier Sprint 03 build may not have contact_events yet.
  // Keep the preview resilient while the final SQL RPC retains the same backward compatibility.
  return { ...merged, contact_events: merged.contact_events ?? [] };
}

export function effectiveClassification(row: ImportRow): ImportClassification {
  return { ...row.classification_data, ...(row.review_data.classification ?? {}) } as ImportClassification;
}
