import { z } from "zod";

export const loginSchema = z.object({ email: z.email(), password: z.string().min(8) });
export const signupSchema = loginSchema.extend({
  name: z.string().min(2).max(50),
  phone: z.string().min(9).max(20),
});

export const leadSourceSchema = z.enum(["WEBSITE", "PAPER", "MANUAL", "LEGACY"]);
export const customerTypeSchema = z.enum(["LEAD", "STUDENT", "INSTRUCTOR", "OTHER"]);
export const leadStatusSchema = z.enum([
  "NEW",
  "CONTACTING",
  "CONSULTED",
  "PAYMENT_PENDING",
  "PAID",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
  "LOST",
]);
export const contactTypeSchema = z.enum(["CALL", "SMS", "KAKAO", "ETC"]);
export const contactResultSchema = z.enum([
  "CONNECTED",
  "NO_ANSWER",
  "CALLBACK",
  "CONSIDERING",
  "PAYMENT_PROMISED",
  "NOT_INTERESTED",
  "SCHEDULE_CONFLICT",
  "PRICE_OBJECTION",
  "INVALID_NUMBER",
  "INFO_SENT",
  "OTHER",
]);
export const followUpPrioritySchema = z.enum(["HIGH", "NORMAL", "LOW"]);

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "이름을 2자 이상 입력해주세요.").max(80),
  phone: z.string().trim().min(9, "연락처를 확인해주세요.").max(30),
  email: z.union([z.literal(""), z.email()]).optional().default(""),
  region: z.string().trim().max(80).optional().default(""),
  source_type: leadSourceSchema.default("MANUAL"),
  source_detail: z.string().trim().max(120).optional().default(""),
  customer_type: customerTypeSchema.default("LEAD"),
  memo: z.string().trim().max(2000).optional().default(""),
  origin_instructor_name: z.string().trim().max(80).optional().default(""),
  origin_course_name: z.string().trim().max(160).optional().default(""),
  origin_attendance_date: z.string().optional().default(""),
  origin_region: z.string().trim().max(80).optional().default(""),
  offered_course_name: z.string().trim().max(160).optional().default(""),
  offered_region: z.string().trim().max(80).optional().default(""),
  offered_date: z.string().optional().default(""),
});


export const createLeadSchema = z.object({
  customer_id: z.uuid(),
  source_type: leadSourceSchema.default("MANUAL"),
  source_detail: z.string().trim().max(120).optional().default(""),
  origin_instructor_name: z.string().trim().max(80).optional().default(""),
  origin_course_name: z.string().trim().max(160).optional().default(""),
  origin_attendance_date: z.string().optional().default(""),
  origin_region: z.string().trim().max(80).optional().default(""),
  offered_course_name: z.string().trim().max(160).optional().default(""),
  offered_region: z.string().trim().max(80).optional().default(""),
  offered_date: z.string().optional().default(""),
  legacy_note: z.string().trim().max(4000).optional().default(""),
});

export const recordConsultationSchema = z
  .object({
    customer_id: z.uuid(),
    lead_id: z.union([z.uuid(), z.literal("")]).optional().default(""),
    contact_type: contactTypeSchema.default("CALL"),
    result: contactResultSchema,
    note: z.string().trim().max(4000).optional().default(""),
    follow_up_required: z.boolean().default(false),
    follow_up_at: z.string().optional().default(""),
    follow_up_reason: z.string().trim().max(500).optional().default(""),
    follow_up_priority: followUpPrioritySchema.default("NORMAL"),
  })
  .superRefine((value, ctx) => {
    if (value.follow_up_required && !value.follow_up_at) {
      ctx.addIssue({
        code: "custom",
        path: ["follow_up_at"],
        message: "재연락 날짜를 선택해주세요.",
      });
    }
  });

export const courseTypeSchema = z.enum(["ONE_DAY", "ONLINE", "INSTRUCTOR_TRAINING", "CORPORATE", "EXTERNAL_LECTURE", "FREE_LECTURE"]);
export const courseStatusSchema = z.enum(["DRAFT", "RECRUITING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const venueStatusSchema = z.enum(["NOT_REQUIRED", "PENDING", "CONFIRMED"]);
export const checklistStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "NOT_REQUIRED"]);

export const courseSessionInputSchema = z.object({
  session_no: z.number().int().min(1),
  title: z.string().trim().max(120).optional().default(""),
  start_at: z.string().min(1),
  end_at: z.string().min(1),
  meeting_url: z.union([z.literal(""), z.url()]).optional().default(""),
}).refine((value) => new Date(value.end_at).getTime() > new Date(value.start_at).getTime(), { message: "종료시간은 시작시간보다 늦어야 합니다.", path: ["end_at"] });

export const courseInputSchema = z.object({
  course_code: z.string().trim().max(60).optional().default(""),
  course_type: courseTypeSchema,
  title: z.string().trim().min(2).max(160),
  region: z.string().trim().max(80).optional().default(""),
  start_at: z.string().min(1),
  end_at: z.string().min(1),
  capacity: z.number().int().min(0).max(10000),
  base_price: z.number().int().min(0),
  status: courseStatusSchema.default("DRAFT"),
  venue_status: venueStatusSchema.default("PENDING"),
  venue_name: z.string().trim().max(160).optional().default(""),
  venue_address: z.string().trim().max(300).optional().default(""),
  restaurant_status: venueStatusSchema.default("PENDING"),
  restaurant_name: z.string().trim().max(160).optional().default(""),
  restaurant_address: z.string().trim().max(300).optional().default(""),
  expected_attendees: z.number().int().min(0).max(10000).nullable().optional().default(null),
  internal_memo: z.string().trim().max(4000).optional().default(""),
  sessions: z.array(courseSessionInputSchema).max(30).default([]),
}).refine((value) => new Date(value.end_at).getTime() > new Date(value.start_at).getTime(), { message: "종료시간은 시작시간보다 늦어야 합니다.", path: ["end_at"] });

export const enrollmentInputSchema = z.object({
  course_id: z.uuid(),
  customer_id: z.uuid(),
  lead_id: z.union([z.uuid(), z.literal("")]).optional().default(""),
  application_source: leadSourceSchema.default("MANUAL"),
  list_price: z.number().int().min(0),
  discount_amount: z.number().int().min(0),
  discount_reason: z.string().trim().max(500).optional().default(""),
  memo: z.string().trim().max(2000).optional().default(""),
}).refine((value) => value.discount_amount <= value.list_price, { message: "할인금액은 정상가보다 클 수 없습니다.", path: ["discount_amount"] });

export const checklistUpdateSchema = z.object({
  item_id: z.uuid(),
  status: checklistStatusSchema,
  memo: z.string().trim().max(1000).optional().default(""),
});

export const paymentStageSchema = z.enum(["DEPOSIT", "PARTIAL", "BALANCE", "FULL"]);
export const paymentMethodSchema = z.enum(["BANK", "CARD", "ON_SITE_CARD", "CASH", "ETC"]);
export const attendanceRecordStatusSchema = z.enum(["EXPECTED", "PRESENT", "LATE", "ABSENT"]);

export const paymentRecordSchema = z.object({
  enrollment_id: z.uuid(),
  payer_name: z.string().trim().min(1, "입금자명을 입력해주세요.").max(120),
  payment_stage: paymentStageSchema,
  payment_method: paymentMethodSchema,
  amount: z.number().int().positive("결제금액을 입력해주세요."),
  paid_at: z.string().min(1),
  payment_due_at: z.string().optional().default(""),
  reference_no: z.string().trim().max(120).optional().default(""),
  memo: z.string().trim().max(2000).optional().default(""),
});

export const paymentDueSchema = z.object({
  enrollment_id: z.uuid(),
  payment_due_at: z.string().optional().default(""),
});

export const refundRequestSchema = z.object({
  enrollment_id: z.uuid(),
  requested_amount: z.number().int().positive(),
  reason: z.string().trim().min(2, "환불 사유를 입력해주세요.").max(1000),
  cancel_enrollment: z.boolean().default(false),
  memo: z.string().trim().max(2000).optional().default(""),
});

export const refundRecordSchema = z.object({
  enrollment_id: z.uuid(),
  refund_request_id: z.union([z.uuid(), z.literal("")]).optional().default(""),
  amount: z.number().int().positive(),
  payment_method: paymentMethodSchema,
  paid_at: z.string().min(1),
  cancel_enrollment: z.boolean().default(false),
  reference_no: z.string().trim().max(120).optional().default(""),
  memo: z.string().trim().max(2000).optional().default(""),
});

export const attendanceRecordSchema = z.object({
  enrollment_id: z.uuid(),
  session_id: z.uuid(),
  status: attendanceRecordStatusSchema,
  note: z.string().trim().max(1000).optional().default(""),
});

export const instructorStageSchema = z.enum(["APPLIED","TRAINING","DEMO","EVALUATION","APPROVED","ACTIVE","TOP_INSTRUCTOR"]);
export const instructorActiveStatusSchema = z.enum(["ACTIVE","PAUSED","INACTIVE"]);
export const instructorAvailabilityStatusSchema = z.enum(["AVAILABLE","UNAVAILABLE","TENTATIVE"]);
export const instructorAssignmentRoleSchema = z.enum(["PRIMARY","ASSISTANT"]);
export const instructorAssignmentResponseSchema = z.enum(["AVAILABLE","DECLINED"]);

const stringArray = z.array(z.string().trim().min(1).max(80)).max(30).default([]);
export const instructorInputSchema = z.object({
  instructor_id: z.union([z.uuid(),z.literal("")]).optional().default(""),
  user_id: z.union([z.uuid(),z.literal("")]).optional().default(""),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional().default(""),
  email: z.union([z.literal(""),z.email()]).optional().default(""),
  stage: instructorStageSchema.default("APPLIED"),
  active_status: instructorActiveStatusSchema.default("ACTIVE"),
  home_region: z.string().trim().max(80).optional().default(""),
  available_regions: stringArray,
  specialties: stringArray,
  lecture_types: stringArray,
  base_fee: z.number().int().min(0).max(100000000),
  memo: z.string().trim().max(3000).optional().default(""),
});

export const instructorAvailabilityInputSchema = z.object({
  instructor_id: z.union([z.uuid(),z.literal("")]).optional().default(""),
  start_at: z.string().min(1),
  end_at: z.string().min(1),
  status: instructorAvailabilityStatusSchema,
  reason: z.string().trim().max(500).optional().default(""),
}).refine((value)=>new Date(value.end_at).getTime()>new Date(value.start_at).getTime(),{message:"종료시간은 시작시간보다 늦어야 합니다.",path:["end_at"]});

export const instructorAssignmentRequestSchema = z.object({
  course_id: z.uuid(),
  instructor_id: z.uuid(),
  role: instructorAssignmentRoleSchema.default("PRIMARY"),
  fee: z.number().int().min(0).max(100000000),
  memo: z.string().trim().max(1000).optional().default(""),
});

export const instructorAssignmentResponseInputSchema = z.object({
  assignment_id: z.uuid(),
  response: instructorAssignmentResponseSchema,
  note: z.string().trim().max(1000).optional().default(""),
});
