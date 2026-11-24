import type { ContactResult, ContactType, FollowUpPriority, LeadSourceType, LeadStatus } from "@aileaders/domain";

export const leadStatusLabels: Record<LeadStatus, string> = {
  NEW: "신규",
  CONTACTING: "연락중",
  CONSULTED: "상담완료",
  PAYMENT_PENDING: "결제대기",
  PAID: "결제완료",
  COMPLETED: "수강완료",
  CANCELLED: "취소",
  REFUNDED: "환불",
  LOST: "종료",
};

export const leadStatusTones: Record<LeadStatus, "info" | "warning" | "success" | "danger" | "neutral"> = {
  NEW: "info",
  CONTACTING: "warning",
  CONSULTED: "info",
  PAYMENT_PENDING: "warning",
  PAID: "success",
  COMPLETED: "success",
  CANCELLED: "neutral",
  REFUNDED: "danger",
  LOST: "neutral",
};

export const contactResultLabels: Record<ContactResult, string> = {
  CONNECTED: "통화 연결",
  NO_ANSWER: "전화 부재",
  CALLBACK: "재연락 요청",
  CONSIDERING: "고민중",
  PAYMENT_PROMISED: "입금 예정",
  NOT_INTERESTED: "관심 없음",
  SCHEDULE_CONFLICT: "일정 불가",
  PRICE_OBJECTION: "가격 부담",
  INVALID_NUMBER: "번호 오류",
  INFO_SENT: "안내 발송",
  OTHER: "기타",
};

export const contactTypeLabels: Record<ContactType, string> = {
  CALL: "전화",
  SMS: "문자",
  KAKAO: "카카오",
  ETC: "기타",
};

export const priorityLabels: Record<FollowUpPriority, string> = {
  HIGH: "높음",
  NORMAL: "보통",
  LOW: "낮음",
};

export const sourceLabels: Record<LeadSourceType, string> = {
  WEBSITE: "홈페이지",
  PAPER: "현장 신청서",
  MANUAL: "직접 등록",
  LEGACY: "기존 엑셀",
};

export const customerTabs = [
  { key: "ALL", label: "전체" },
  { key: "NEW", label: "신규" },
  { key: "TODAY_FOLLOW_UP", label: "오늘 재연락" },
  { key: "CONTACTING", label: "연락중" },
  { key: "CONSULTED", label: "상담완료" },
  { key: "PAYMENT_PENDING", label: "결제대기" },
  { key: "PAID", label: "결제완료" },
] as const;

export type CustomerTab = (typeof customerTabs)[number]["key"];
