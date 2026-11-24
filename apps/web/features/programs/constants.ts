import type { AttendanceRecordStatus, ChecklistStatus, CourseStatus, CourseType, DisplayPaymentStatus, EnrollmentPaymentStatus, PaymentMethod, PaymentStage } from "@aileaders/domain";

export const courseTypeLabels: Record<CourseType, string> = {
  ONE_DAY: "원데이",
  ONLINE: "온라인",
  INSTRUCTOR_TRAINING: "강사양성",
  CORPORATE: "기업교육",
  EXTERNAL_LECTURE: "외부강연",
  FREE_LECTURE: "무료강의",
};

export const courseStatusLabels: Record<CourseStatus, string> = {
  DRAFT: "작성중",
  RECRUITING: "모집중",
  CONFIRMED: "확정",
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

export const courseStatusTones: Record<CourseStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  DRAFT: "neutral", RECRUITING: "info", CONFIRMED: "success", IN_PROGRESS: "warning", COMPLETED: "success", CANCELLED: "danger",
};

export const checklistStatusLabels: Record<ChecklistStatus, string> = {
  TODO: "미완료", IN_PROGRESS: "진행중", DONE: "완료", NOT_REQUIRED: "해당없음",
};

export const paymentStatusLabels: Record<EnrollmentPaymentStatus, string> = {
  PENDING: "결제대기", DEPOSIT_PAID: "예약금", PARTIALLY_PAID: "일부결제", PAID: "결제완료", REFUNDED: "환불",
};

export const courseTabs: Array<{ key: CourseType | "ALL"; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "ONE_DAY", label: "원데이" },
  { key: "ONLINE", label: "온라인" },
  { key: "INSTRUCTOR_TRAINING", label: "강사양성" },
  { key: "CORPORATE", label: "기업교육" },
  { key: "EXTERNAL_LECTURE", label: "외부강연" },
  { key: "FREE_LECTURE", label: "무료강의" },
];


export const displayPaymentStatusLabels: Record<DisplayPaymentStatus,string> = {
  PAYMENT_PENDING:"결제대기", DEPOSIT_PAID:"예약금", PARTIALLY_PAID:"일부결제", PAID:"결제완료",
  REFUND_REQUESTED:"환불요청", PARTIALLY_REFUNDED:"부분환불", FULLY_REFUNDED:"전액환불",
};

export const displayPaymentStatusTones: Record<DisplayPaymentStatus,"neutral"|"info"|"warning"|"success"|"danger"> = {
  PAYMENT_PENDING:"warning", DEPOSIT_PAID:"warning", PARTIALLY_PAID:"warning", PAID:"success",
  REFUND_REQUESTED:"danger", PARTIALLY_REFUNDED:"warning", FULLY_REFUNDED:"danger",
};

export const paymentStageLabels: Record<Exclude<PaymentStage,"REFUND">,string> = {
  DEPOSIT:"예약금", PARTIAL:"일부결제", BALANCE:"잔금", FULL:"전액",
};

export const paymentMethodLabels: Record<PaymentMethod,string> = {
  BANK:"계좌이체", CARD:"카드", ON_SITE_CARD:"현장 카드", CASH:"현금", ETC:"기타",
};

export const attendanceStatusLabels: Record<AttendanceRecordStatus,string> = {
  EXPECTED:"예정", PRESENT:"출석", LATE:"지각", ABSENT:"결석",
};
