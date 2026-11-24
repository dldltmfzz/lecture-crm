import ExcelJS from "exceljs";
import type { ImportNormalizedRow, ImportSheetKind } from "@aileaders/domain";
import { normalizeKoreanPhone } from "@aileaders/utils";

export interface ParsedImportRow {
  sheetName: string;
  sheetRow: number;
  sheetKind: ImportSheetKind;
  rawData: Record<string, unknown>;
  normalized: ImportNormalizedRow;
  parseErrors: string[];
}

export interface ParsedWorkbook {
  sheetCount: number;
  rows: ParsedImportRow[];
  skippedSheets: string[];
}

type CellScalar = string | number | boolean | Date | null;

const KOREA_YEAR = 2026;
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

export async function parseLegacyWorkbook(buffer: Buffer): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  // ExcelJS 4 declares its input as ArrayBuffer while Node 24 exposes Buffer
  // with a generic ArrayBufferLike backing type. Copying produces a plain
  // ArrayBuffer and keeps the runtime data unchanged.
  await workbook.xlsx.load(new Uint8Array(buffer).buffer);

  const rows: ParsedImportRow[] = [];
  const skippedSheets: string[] = [];

  for (const worksheet of workbook.worksheets) {
    const headers = readHeaderRow(worksheet, 2);
    const sheetKind = detectSheetKind(headers);
    if (!sheetKind) {
      skippedSheets.push(worksheet.name);
      continue;
    }

    const headerMap = indexHeaders(headers);
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 2) return;
      const name = cellText(row.getCell(findColumn(headerMap, "이름", 4)));
      const phoneRaw = cellScalar(row.getCell(findColumn(headerMap, "연락처", 5)));
      if (!name && isEmpty(phoneRaw)) return;

      const parsed = sheetKind === "CRM"
        ? parseCrmRow(worksheet.name, row, rowNumber, headerMap)
        : parseConfirmedRow(worksheet.name, row, rowNumber, headerMap);
      rows.push(parsed);
    });
  }

  return { sheetCount: workbook.worksheets.length, rows, skippedSheets };
}

function parseCrmRow(
  sheetName: string,
  row: ExcelJS.Row,
  rowNumber: number,
  headerMap: Map<string, number>,
): ParsedImportRow {
  const name = cellText(row.getCell(findColumn(headerMap, "이름", 4)));
  const phone = stringifyPhone(cellScalar(row.getCell(findColumn(headerMap, "연락처", 5))));
  const region = nullableText(row.getCell(findColumn(headerMap, "수강/지역", 6)));
  const originInstructor = nullableText(row.getCell(findColumn(headerMap, "강사", 1)));
  const originCourse = nullableText(row.getCell(findColumn(headerMap, "강의명", 2)));
  const originAttendance = parseDateValue(cellScalar(row.getCell(findColumn(headerMap, "강의 참석일", 3))));
  const offeredRegion = cleanDash(nullableText(row.getCell(findColumn(headerMap, "안내/지역", 7))));
  const offeredDate = parseDateValue(cellScalar(row.getCell(findColumn(headerMap, "안내 일정", 8))));
  const baseLegacyNote = nullableText(row.getCell(findColumn(headerMap, "비고", 12)));
  const contactCells = ["1차 연락", "2차 연락", "3차 연락"].map((header, index) => {
    const raw = cellScalar(row.getCell(findColumn(headerMap, header, 9 + index)));
    return { header, round: index + 1, raw, parsedDate: parseDateValue(raw) };
  });
  const contactEvents = contactCells
    .filter(({ raw, parsedDate }) => Boolean(parsedDate) || isMeaningfulContactText(raw))
    .map(({ round, raw, parsedDate }) => ({
      round,
      contact_at: parsedDate ? seoulNoonIso(parsedDate) : null,
      note: !parsedDate && isMeaningfulContactText(raw) ? String(raw).trim() : null,
    }));
  const contactDates = contactCells
    .map(({ parsedDate }) => parsedDate)
    .filter((value): value is string => Boolean(value))
    .map((value) => seoulNoonIso(value));
  const contactTextNotes = contactCells
    .filter(({ raw, parsedDate }) => !parsedDate && isMeaningfulContactText(raw))
    .map(({ header, raw }) => `${header}: ${String(raw).trim()}`);
  const legacyNote = joinLegacyNotes(baseLegacyNote, contactTextNotes);

  const normalizedPhone = normalizeKoreanPhone(phone);
  const errors = validateIdentity(name, normalizedPhone);

  return {
    sheetName,
    sheetRow: rowNumber,
    sheetKind: "CRM",
    rawData: rawRow(row),
    normalized: {
      name,
      phone,
      phone_normalized: normalizedPhone,
      email: null,
      region,
      source_type: inferLegacySourceType(sheetName),
      source_detail: `Legacy Excel · ${sheetName}`,
      origin_instructor_name: originInstructor,
      origin_course_name: originCourse,
      origin_attendance_date: originAttendance,
      origin_region: region,
      offered_course_name: null,
      offered_region: offeredRegion,
      offered_date: offeredDate,
      contact_events: contactEvents,
      contact_dates: unique(contactDates),
      legacy_note: legacyNote,
    },
    parseErrors: errors,
  };
}

function parseConfirmedRow(
  sheetName: string,
  row: ExcelJS.Row,
  rowNumber: number,
  headerMap: Map<string, number>,
): ParsedImportRow {
  const name = cellText(row.getCell(findColumn(headerMap, "이름", 4)));
  const phone = stringifyPhone(cellScalar(row.getCell(findColumn(headerMap, "연락처", 5))));
  const region = nullableText(row.getCell(findColumn(headerMap, "수강/지역", 6)));
  const instructor = nullableText(row.getCell(findColumn(headerMap, "강사", 2)));
  const course = nullableText(row.getCell(findColumn(headerMap, "강의명", 3)));
  const legacyNote = nullableText(row.getCell(findColumn(headerMap, "비고", headerMap.get("비고") ?? 8)));
  const offeredDate = inferDateFromConfirmedSheet(sheetName);
  const offeredRegion = inferRegionFromConfirmedSheet(sheetName) ?? region;
  const normalizedPhone = normalizeKoreanPhone(phone);
  const errors = validateIdentity(name, normalizedPhone);

  return {
    sheetName,
    sheetRow: rowNumber,
    sheetKind: "CONFIRMED",
    rawData: rawRow(row),
    normalized: {
      name,
      phone,
      phone_normalized: normalizedPhone,
      email: null,
      region,
      source_type: inferLegacySourceType(sheetName),
      source_detail: `Legacy Excel · ${sheetName} · 유료 확정명단`,
      origin_instructor_name: instructor,
      origin_course_name: null,
      origin_attendance_date: null,
      origin_region: null,
      offered_course_name: course || "AI 활용 실무 과정",
      offered_region: offeredRegion,
      offered_date: offeredDate,
      contact_events: [],
      contact_dates: [],
      legacy_note: legacyNote,
    },
    parseErrors: errors,
  };
}

function detectSheetKind(headers: string[]): ImportSheetKind | null {
  if (headers[0] === "강사" && headers.includes("이름") && headers.includes("연락처")) return "CRM";
  if (headers[0] === "No" && headers.includes("이름") && headers.includes("연락처")) return "CONFIRMED";
  return null;
}

function readHeaderRow(worksheet: ExcelJS.Worksheet, rowNumber: number): string[] {
  const row = worksheet.getRow(rowNumber);
  const result: string[] = [];
  for (let col = 1; col <= Math.max(15, row.cellCount); col += 1) {
    result.push(cellText(row.getCell(col)).trim());
  }
  return result;
}

function indexHeaders(headers: string[]) {
  const map = new Map<string, number>();
  headers.forEach((header, index) => {
    if (header && !map.has(header)) map.set(header, index + 1);
  });
  return map;
}

function findColumn(map: Map<string, number>, header: string, fallback: number) {
  return map.get(header) ?? fallback;
}

function cellScalar(cell: ExcelJS.Cell): CellScalar {
  const value = cell.value;
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object") {
    if ("result" in value) {
      const result = value.result;
      if (result instanceof Date || typeof result === "string" || typeof result === "number" || typeof result === "boolean") return result;
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("text" in value && typeof value.text === "string") return value.text;
  }
  return String(value);
}

function cellText(cell: ExcelJS.Cell): string {
  const scalar = cellScalar(cell);
  if (scalar == null) return "";
  if (scalar instanceof Date) return datePartsToYmd(scalar.getUTCFullYear(), scalar.getUTCMonth() + 1, scalar.getUTCDate());
  return String(scalar).trim();
}

function nullableText(cell: ExcelJS.Cell): string | null {
  const value = cellText(cell).trim();
  return value ? value : null;
}

function cleanDash(value: string | null): string | null {
  if (!value || value === "-" || value === "–") return null;
  return value;
}

function stringifyPhone(value: CellScalar): string {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
  return String(value).trim();
}

function validateIdentity(name: string, phone: string | null) {
  const errors: string[] = [];
  const cleanedName = name.trim();
  if (cleanedName.length < 2 || /^[-–—_]+$/.test(cleanedName)) errors.push("NAME_REQUIRED");
  if (!phone || !/^0\d{9,10}$/.test(phone)) errors.push("INVALID_PHONE");
  return errors;
}

function parseDateValue(value: CellScalar): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return datePartsToYmd(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }
  if (typeof value === "number") {
    if (value > 30000 && value < 80000) {
      const date = new Date(EXCEL_EPOCH + Math.round(value) * 86400000);
      return datePartsToYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }
    const compact = String(Math.trunc(value));
    if (/^\d{3,4}$/.test(compact)) return compactMonthDay(compact);
    return null;
  }

  const text = String(value).trim();
  if (!text || text === "-" || /일정\s*안내/.test(text)) return null;
  // A few legacy cells use a compact malformed ISO-like value such as
  // `2026-0804`. Interpret it as 2026-08-04 instead of silently dropping it.
  const compactIso = text.match(/^(20\d{2})[-./](\d{2})(\d{2})$/);
  if (compactIso) return validYmd(Number(compactIso[1]), Number(compactIso[2]), Number(compactIso[3]));
  const iso = text.match(/^(20\d{2})[-./]\s*(\d{1,2})[-./]\s*(\d{1,2})/);
  if (iso) return validYmd(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const korean = text.match(/(?:(20\d{2})\s*[.년]\s*)?(\d{1,2})\s*월\s*(\d{1,2})\s*일?/);
  if (korean) return validYmd(Number(korean[1] || KOREA_YEAR), Number(korean[2]), Number(korean[3]));
  const slash = text.match(/^(\d{1,2})\s*[./-]\s*(\d{1,2})$/);
  if (slash) return validYmd(KOREA_YEAR, Number(slash[1]), Number(slash[2]));
  if (/^\d{3,4}$/.test(text)) return compactMonthDay(text);
  return null;
}

function compactMonthDay(value: string) {
  const month = value.length === 3 ? Number(value.slice(0, 1)) : Number(value.slice(0, 2));
  const day = Number(value.slice(-2));
  return validYmd(KOREA_YEAR, month, day);
}

function validYmd(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  return datePartsToYmd(year, month, day);
}

function datePartsToYmd(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function seoulNoonIso(ymd: string) {
  return `${ymd}T12:00:00+09:00`;
}

function inferLegacySourceType(sheetName: string): ImportNormalizedRow["source_type"] {
  if (sheetName.trim() === "홈페이지신청자") return "WEBSITE";
  // The exact acquisition source is not provable for the other legacy sheets.
  // Keep them as LEGACY instead of inventing PAPER/MANUAL provenance.
  return "LEGACY";
}

function inferDateFromConfirmedSheet(sheetName: string): string | null {
  const match = sheetName.match(/유료(\d{3,4})/);
  if (!match) return null;
  return compactMonthDay(match[1]);
}

function inferRegionFromConfirmedSheet(sheetName: string): string | null {
  const match = sheetName.match(/유료\d{3,4}\s*(.+)$/);
  return match?.[1]?.trim() || null;
}

function rawRow(row: ExcelJS.Row): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const max = Math.max(15, row.cellCount);
  for (let col = 1; col <= max; col += 1) {
    const value = cellScalar(row.getCell(col));
    result[columnName(col)] = serializeCell(value);
  }
  return result;
}

function serializeCell(value: CellScalar): unknown {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function columnName(index: number) {
  let value = index;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function isEmpty(value: CellScalar) {
  return value == null || String(value).trim() === "";
}

function isMeaningfulContactText(value: CellScalar) {
  if (isEmpty(value)) return false;
  const text = String(value).trim();
  return !/^[-–—_]+$/.test(text);
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function joinLegacyNotes(base: string | null, extra: string[]) {
  const parts = [base?.trim() || null, ...extra.map((value) => value.trim())]
    .filter((value): value is string => Boolean(value));
  return parts.length ? parts.join("\n") : null;
}

export const importParserInternals = {
  parseDateValue,
  inferDateFromConfirmedSheet,
  inferRegionFromConfirmedSheet,
  inferLegacySourceType,
};
