export function normalizeKoreanPhone(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  let digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("82") && digits.length >= 11) digits = `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("10")) digits = `0${digits}`;
  return digits;
}

export function formatKoreanPhone(input: string | number | null | undefined): string {
  const digits = normalizeKoreanPhone(input);
  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

export function isValidKoreanPhone(input: string | number | null | undefined): boolean {
  const digits = normalizeKoreanPhone(input);
  return /^0\d{9,10}$/.test(digits);
}
