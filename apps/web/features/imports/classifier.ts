import type {
  ContactResult,
  FollowUpPriority,
  ImportClassification,
  ImportNormalizedRow,
  ImportSheetKind,
  LeadStatus,
} from "@aileaders/domain";

const DEFAULT_YEAR = 2026;

export function classifyLegacyRow(
  normalized: ImportNormalizedRow,
  sheetKind: ImportSheetKind,
): ImportClassification {
  const note = normalizeText(normalized.legacy_note ?? "");
  const signals = new Set<string>();

  if (/예약금/.test(note)) signals.add("DEPOSIT");
  if (/입금\s*완료|결제\s*완료/.test(note)) signals.add("PAID");
  if (/입금\s*예정|결제\s*예정/.test(note)) signals.add("PAYMENT_PROMISED");
  if (/환불/.test(note)) signals.add("REFUND");
  if (/세금\s*계산서/.test(note)) signals.add("TAX_INVOICE");
  if (/동반|지인|부부|같이\s*등록|2명\s*동시/.test(note)) signals.add("GROUP_APPLICATION");
  if (/온라인|줌/.test(note)) signals.add("ONLINE_INTEREST");
  if (/강사\s*(양성|과정)|강사과정/.test(note)) signals.add("INSTRUCTOR_TRAINING_INTEREST");
  if (/안내\s*문자|문자\s*발송|문자요청|메일\s*전달/.test(note)) signals.add("MESSAGE_SENT");
  if (/재수강/.test(note)) signals.add("REPEAT_STUDENT");

  let result: ContactResult = "OTHER";
  let leadStatus: LeadStatus = sheetKind === "CONFIRMED" ? "PAID" : "NEW";
  let confidence = sheetKind === "CONFIRMED" ? 0.82 : 0.55;

  // A CRM row with a recorded contact date is not truly NEW even when the memo is blank.
  // Keep the result conservative (OTHER), but preserve the operational state as CONTACTING.
  if (!note && sheetKind === "CRM" && normalized.contact_dates.length > 0) {
    leadStatus = "CONTACTING";
    confidence = 0.86;
  }

  if (/없는\s*번호|번호\s*오류|잘못된\s*번호/.test(note)) {
    result = "INVALID_NUMBER";
    leadStatus = "LOST";
    confidence = 0.98;
  } else if (/환불/.test(note)) {
    result = "OTHER";
    leadStatus = "REFUNDED";
    confidence = 0.96;
  } else if (/입금\s*완료|결제\s*완료/.test(note)) {
    result = "CONNECTED";
    leadStatus = "PAID";
    confidence = 0.98;
  } else if (/예약금/.test(note)) {
    result = "PAYMENT_PROMISED";
    leadStatus = "PAYMENT_PENDING";
    confidence = 0.94;
  } else if (/입금\s*예정|결제\s*예정/.test(note)) {
    result = "PAYMENT_PROMISED";
    leadStatus = "PAYMENT_PENDING";
    confidence = 0.96;
  } else if (/전화\s*부재|연락\s*부재|연락\s*불가|전화\s*불가/.test(note)) {
    result = "NO_ANSWER";
    leadStatus = "CONTACTING";
    confidence = 0.95;
  } else if (/비용\s*(부담|비쌈|지불\s*불가)|금액\s*비쌈/.test(note)) {
    result = "PRICE_OBJECTION";
    leadStatus = /재연락|희망|고민/.test(note) ? "CONSULTED" : "LOST";
    confidence = 0.93;
  } else if (/일정\s*(불가|어려움)|주말\s*불가|개인사정.*불가|가족\s*행사/.test(note)) {
    result = "SCHEDULE_CONFLICT";
    leadStatus = /재연락|희망|다음|9월|10월|온라인/.test(note) ? "CONSULTED" : "LOST";
    confidence = 0.91;
  } else if (/고민|결정\s*예정|확인\s*후|확인\s*\/|일정\s*확인/.test(note)) {
    result = "CONSIDERING";
    leadStatus = "CONSULTED";
    confidence = 0.88;
  } else if (/재연락|연락\s*주기로|연락\s*준다|연락\s*예정/.test(note)) {
    result = "CALLBACK";
    leadStatus = "CONSULTED";
    confidence = 0.9;
  } else if (/안내\s*문자|문자\s*발송|메일\s*전달|안내/.test(note)) {
    result = "INFO_SENT";
    leadStatus = "CONTACTING";
    confidence = 0.82;
  } else if (note) {
    result = "CONNECTED";
    leadStatus = sheetKind === "CONFIRMED" ? "PAID" : "CONSULTED";
    confidence = 0.62;
  }

  const explicitFollowUpDate = extractExactFollowUpDate(note);
  const vagueFollowUp = /재연락|연락\s*예정|입금\s*예정|결정\s*예정|재검토/.test(note);
  const vagueDate = vagueFollowUp && !explicitFollowUpDate && /말|초|중순|차주|다음|오픈시|때|월말|월초/.test(note);
  const followUpRequired = Boolean(explicitFollowUpDate || vagueFollowUp);
  if (vagueDate) signals.add("VAGUE_FOLLOW_UP_DATE");

  const followUpAt = explicitFollowUpDate ? `${explicitFollowUpDate}T10:00:00+09:00` : null;
  const followUpPriority: FollowUpPriority = leadStatus === "PAYMENT_PENDING" ? "HIGH" : "NORMAL";
  const needsReview = Boolean(
    !normalized.phone_normalized ||
    vagueDate ||
    (followUpRequired && !followUpAt) ||
    (result === "OTHER" && Boolean(note)),
  );

  return {
    result,
    lead_status: leadStatus,
    follow_up_required: followUpRequired,
    follow_up_at: followUpAt,
    follow_up_reason: followUpRequired ? buildFollowUpReason(note, leadStatus) : null,
    follow_up_priority: followUpPriority,
    summary: summarize(note, result, leadStatus, sheetKind),
    signals: [...signals],
    confidence: Math.min(1, Math.max(0, confidence - (vagueDate ? 0.15 : 0))),
    needs_review: needsReview,
  };
}

export function mergeAiClassification(
  base: ImportClassification,
  ai: Partial<ImportClassification>,
): ImportClassification {
  const signals = [...new Set([...(base.signals ?? []), ...(ai.signals ?? [])])];
  const hardReview = signals.some((signal) => ["NAME_MISMATCH", "VAGUE_FOLLOW_UP_DATE"].includes(signal));
  const merged: ImportClassification = {
    ...base,
    ...ai,
    signals,
    confidence: clamp(ai.confidence ?? base.confidence),
  };

  // AI may enrich semantic classification, but it cannot erase a deterministic exact follow-up
  // or convert a vague date into a fabricated exact date. Those require human review.
  if (base.follow_up_required) merged.follow_up_required = true;
  if (base.follow_up_at) merged.follow_up_at = base.follow_up_at;
  if (signals.includes("VAGUE_FOLLOW_UP_DATE")) merged.follow_up_at = null;

  merged.needs_review = Boolean(
    hardReview ||
    ai.needs_review ||
    (merged.follow_up_required && !merged.follow_up_at) ||
    merged.confidence < 0.72,
  );
  return merged;
}

function extractExactFollowUpDate(note: string): string | null {
  const cleaned = note.replace(/(\d)\.\s*\/(\d)/g, "$1/$2");
  const action = "(?:재연락|연락|입금\\s*예정|결제\\s*예정|재검토|결정\\s*예정)";
  const vagueNearAction = new RegExp(`\\d{1,2}\\s*월\\s*(?:초|초중순|중순|말|말일|월말).{0,8}${action}`);
  if (vagueNearAction.test(cleaned)) return null;

  const koreanBefore = cleaned.match(new RegExp(`(?:(20\\d{2})\\s*[.년]\\s*)?(\\d{1,2})\\s*월\\s*(\\d{1,2})\\s*일?(?:자|경|까지)?\\s*.{0,8}${action}`));
  if (koreanBefore) return validYmd(Number(koreanBefore[1] || DEFAULT_YEAR), Number(koreanBefore[2]), Number(koreanBefore[3]));

  const slashBefore = cleaned.match(new RegExp(`(?:^|[^\\d])(\\d{1,2})\\s*[/.-]\\s*(\\d{1,2})(?:\\s*일)?(?:\\s*(?:까지|경|자))?\\s*.{0,8}${action}`));
  if (slashBefore) return validYmd(DEFAULT_YEAR, Number(slashBefore[1]), Number(slashBefore[2]));

  const slashAfter = cleaned.match(new RegExp(`${action}.{0,10}?(\\d{1,2})\\s*[/.-]\\s*(\\d{1,2})`));
  if (slashAfter) return validYmd(DEFAULT_YEAR, Number(slashAfter[1]), Number(slashAfter[2]));

  const koreanAfter = cleaned.match(new RegExp(`${action}.{0,10}?(\\d{1,2})\\s*월\\s*(\\d{1,2})\\s*일?`));
  if (koreanAfter) return validYmd(DEFAULT_YEAR, Number(koreanAfter[1]), Number(koreanAfter[2]));
  return null;
}

function validYmd(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildFollowUpReason(note: string, status: LeadStatus) {
  if (status === "PAYMENT_PENDING") return "입금 예정 확인";
  if (/온라인/.test(note)) return "온라인 과정 안내 재연락";
  if (/강사/.test(note)) return "강사양성과정 후속 연락";
  if (/일정/.test(note)) return "가능 일정 확인";
  return "Legacy 메모 기반 재연락";
}

function summarize(note: string, result: ContactResult, status: LeadStatus, sheetKind: ImportSheetKind) {
  if (!note) return sheetKind === "CONFIRMED" ? "유료 확정명단 등록자" : "Legacy 상담 메모 없음";
  const trimmed = note.length > 80 ? `${note.slice(0, 77)}…` : note;
  return `${trimmed} · ${result}/${status}`;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export const importClassifierInternals = { extractExactFollowUpDate };
