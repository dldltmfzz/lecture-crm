import { describe, expect, it } from "vitest";
import { formatKoreanPhone, isValidKoreanPhone, normalizeKoreanPhone } from "@aileaders/utils";

describe("Korean phone normalization", () => {
  it("restores a leading zero lost by Excel numeric cells", () => {
    expect(normalizeKoreanPhone(1012345678)).toBe("01012345678");
  });

  it("removes punctuation from mixed legacy formats", () => {
    expect(normalizeKoreanPhone("(010) 1234-5678")).toBe("01012345678");
    expect(normalizeKoreanPhone("010 1234 5678")).toBe("01012345678");
  });

  it("normalizes a Korean country code", () => {
    expect(normalizeKoreanPhone("+82 10-1234-5678")).toBe("01012345678");
  });

  it("formats normalized mobile numbers for display", () => {
    expect(formatKoreanPhone("01012345678")).toBe("010-1234-5678");
  });

  it("rejects too-short numbers", () => {
    expect(isValidKoreanPhone("0101234")).toBe(false);
  });
});
