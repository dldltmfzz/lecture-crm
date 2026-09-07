import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { importParserInternals, parseLegacyWorkbook } from "@/features/imports/parser";

describe("legacy workbook parser", () => {
  it("parses Excel serials and compact month/day numbers", () => {
    expect(importParserInternals.parseDateValue(46241)).toBe("2026-08-07");
    expect(importParserInternals.parseDateValue(903)).toBe("2026-09-03");
    expect(importParserInternals.parseDateValue("2026-0804")).toBe("2026-08-04");
    expect(importParserInternals.inferDateFromConfirmedSheet("유료920서울")).toBe("2026-09-20");
    expect(importParserInternals.inferRegionFromConfirmedSheet("유료1024부산")).toBe("부산");
  });

  it("parses CRM and confirmed layouts", async () => {
    const workbook = new ExcelJS.Workbook();
    const crm = workbook.addWorksheet("807서초");
    crm.addRow(["AILeaders"]);
    crm.addRow(["강사","강의명","강의 참석일","이름","연락처","수강/지역","안내/지역","안내 일정","1차 연락","2차 연락","3차 연락","비고"]);
    crm.addRow(["아이온","AI 활용 실무 과정",46241,"홍길동",1012345678,"서초","서울",46256,46248,null,null,"전화 부재 / 안내 문자 발송"]);

    const paid = workbook.addWorksheet("유료919제주");
    paid.addRow(["확정명단"]);
    paid.addRow(["No","강사","강의명","이름","연락처","수강/지역","안내 문자","비고"]);
    paid.addRow([1,"아이온","AI 활용 실무 과정","김제주","(010) 2222-3333","제주",null,"예약금 10만원입금"]);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const parsed = await parseLegacyWorkbook(buffer);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].normalized.phone_normalized).toBe("01012345678");
    expect(parsed.rows[0].normalized.contact_dates[0]).toBe("2026-08-14T12:00:00+09:00");
    expect(parsed.rows[0].normalized.contact_events[0]).toEqual({ round: 1, contact_at: "2026-08-14T12:00:00+09:00", note: null });
    expect(parsed.rows[1].sheetKind).toBe("CONFIRMED");
    expect(parsed.rows[1].normalized.offered_date).toBe("2026-09-19");
    expect(parsed.rows[1].normalized.source_type).toBe("LEGACY");
  });

  it("preserves the known website acquisition source", async () => {
    const workbook = new ExcelJS.Workbook();
    const website = workbook.addWorksheet("홈페이지신청자");
    website.addRow(["AILeaders"]);
    website.addRow(["강사","강의명","강의 참석일","이름","연락처","수강/지역","안내/지역","안내 일정","1차 연락","2차 연락","3차 연락","비고"]);
    website.addRow([null,null,null,"홍길동","010-1111-2222","서울",null,null,null,null,null,null]);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const parsed = await parseLegacyWorkbook(buffer);
    expect(parsed.rows[0].normalized.source_type).toBe("WEBSITE");
  });

  it("preserves non-date contact-cell text in the legacy note", async () => {
    const workbook = new ExcelJS.Workbook();
    const crm = workbook.addWorksheet("1017동대문");
    crm.addRow(["AILeaders"]);
    crm.addRow(["강사","강의명","강의 참석일","이름","연락처","수강/지역","안내/지역","안내 일정","1차 연락","2차 연락","3차 연락","비고"]);
    crm.addRow(["아이온","AI 활용 실무 과정",null,"박주원","010-3333-4444","동대문","서울",1017,null,"노래만들기하고싶었는데 함.! 필요하면 연락 준다함",null,null]);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const parsed = await parseLegacyWorkbook(buffer);
    expect(parsed.rows[0].normalized.contact_dates).toEqual([]);
    expect(parsed.rows[0].normalized.contact_events).toEqual([
      { round: 2, contact_at: null, note: "노래만들기하고싶었는데 함.! 필요하면 연락 준다함" },
    ]);
    expect(parsed.rows[0].normalized.legacy_note).toContain("2차 연락: 노래만들기하고싶었는데 함.! 필요하면 연락 준다함");
  });

  it("ignores dash placeholders in contact columns", async () => {
    const workbook = new ExcelJS.Workbook();
    const crm = workbook.addWorksheet("809성남안성");
    crm.addRow(["AILeaders"]);
    crm.addRow(["강사","강의명","강의 참석일","이름","연락처","수강/지역","안내/지역","안내 일정","1차 연락","2차 연락","3차 연락","비고"]);
    crm.addRow(["아이온","AI 활용 실무 과정",null,"홍길동","010-5555-6666","성남",null,null,"-",null,null,null]);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const parsed = await parseLegacyWorkbook(buffer);
    expect(parsed.rows[0].normalized.contact_dates).toEqual([]);
    expect(parsed.rows[0].normalized.legacy_note).toBeNull();
  });

  it("rejects placeholder one-character names before final import", async () => {
    const workbook = new ExcelJS.Workbook();
    const crm = workbook.addWorksheet("818대구");
    crm.addRow(["AILeaders"]);
    crm.addRow(["강사","강의명","강의 참석일","이름","연락처","수강/지역","안내/지역","안내 일정","1차 연락","2차 연락","3차 연락","비고"]);
    crm.addRow(["아이온","AI 활용 실무 과정",null,"-","010-4444-5555","대구",null,null,null,null,null,null]);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const parsed = await parseLegacyWorkbook(buffer);
    expect(parsed.rows[0].parseErrors).toContain("NAME_REQUIRED");
  });
});
