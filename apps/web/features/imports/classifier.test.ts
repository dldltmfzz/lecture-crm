import { describe, expect, it } from "vitest";
import type { ImportNormalizedRow } from "@aileaders/domain";
import { classifyLegacyRow, importClassifierInternals, mergeAiClassification } from "@/features/imports/classifier";

function row(note: string | null): ImportNormalizedRow {
  return {
    name: "테스트",
    phone: "01012345678",
    phone_normalized: "01012345678",
    email: null,
    region: "서울",
    source_type: "LEGACY",
    source_detail: "test",
    origin_instructor_name: "아이온",
    origin_course_name: "AI 활용 실무 과정",
    origin_attendance_date: "2026-08-07",
    origin_region: "서울",
    offered_course_name: null,
    offered_region: "서울",
    offered_date: "2026-09-20",
    contact_events: [{ round: 1, contact_at: "2026-08-08T12:00:00+09:00", note: null }],
    contact_dates: ["2026-08-08T12:00:00+09:00"],
    legacy_note: note,
  };
}

describe("legacy classifier", () => {
  it("classifies no-answer notes", () => {
    const result = classifyLegacyRow(row("전화 부재 / 안내 문자 발송"), "CRM");
    expect(result.result).toBe("NO_ANSWER");
    expect(result.lead_status).toBe("CONTACTING");
    expect(result.signals).toContain("MESSAGE_SENT");
  });

  it("extracts exact follow-up dates without inventing a time", () => {
    const result = classifyLegacyRow(row("8/17 재연락 (고민후 결정)"), "CRM");
    expect(result.follow_up_at).toBe("2026-08-17T10:00:00+09:00");
    expect(result.follow_up_required).toBe(true);
  });

  it("requires human review for vague dates", () => {
    const result = classifyLegacyRow(row("8월말 재연락"), "CRM");
    expect(result.follow_up_required).toBe(true);
    expect(result.follow_up_at).toBeNull();
    expect(result.needs_review).toBe(true);
    expect(result.signals).toContain("VAGUE_FOLLOW_UP_DATE");
  });

  it("keeps a confirmed deposit as payment pending", () => {
    const result = classifyLegacyRow(row("예약금 10만원입금 / 현장 카드결제"), "CONFIRMED");
    expect(result.lead_status).toBe("PAYMENT_PENDING");
    expect(result.signals).toContain("DEPOSIT");
  });

  it("defaults a confirmed list row to paid", () => {
    const result = classifyLegacyRow(row(null), "CONFIRMED");
    expect(result.lead_status).toBe("PAID");
  });
  it("does not leave contacted CRM rows as NEW when the memo is blank", () => {
    const result = classifyLegacyRow(row(null), "CRM");
    expect(result.lead_status).toBe("CONTACTING");
    expect(result.result).toBe("OTHER");
  });

  it("does not let AI clear structural review flags or invent vague follow-up dates", () => {
    const base = classifyLegacyRow(row("8월말 재연락"), "CRM");
    const merged = mergeAiClassification(base, {
      follow_up_required: true,
      follow_up_at: "2026-08-31T10:00:00+09:00",
      needs_review: false,
      confidence: 0.99,
    });
    expect(merged.follow_up_at).toBeNull();
    expect(merged.needs_review).toBe(true);
  });

});

describe("legacy date extraction", () => {
  it("parses follow-up dates only when linked to an action", () => {
    expect(importClassifierInternals.extractExactFollowUpDate("9/20 재연락")).toBe("2026-09-20");
    expect(importClassifierInternals.extractExactFollowUpDate("온라인 강의 재검토 8/24")).toBe("2026-08-24");
    expect(importClassifierInternals.extractExactFollowUpDate("10/17 9월 중순 재연락")).toBeNull();
  });
});
