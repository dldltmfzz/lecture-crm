export type JobRole = "CEO" | "OPERATIONS" | "SALES" | "INSTRUCTOR" | "ACCOUNTING";
export type PermissionLevel = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER" | "INSTRUCTOR_PORTAL";
export type AccountStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export interface Profile {
  id: string;
  auth_user_id: string;
  name: string;
  phone: string | null;
  job_role: JobRole;
  permission_level: PermissionLevel;
  account_status: AccountStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadSourceType = "WEBSITE" | "PAPER" | "MANUAL" | "LEGACY";
export type CustomerType = "LEAD" | "STUDENT" | "INSTRUCTOR" | "OTHER";
export type LeadStatus =
  | "NEW"
  | "CONTACTING"
  | "CONSULTED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "LOST";
export type ContactType = "CALL" | "SMS" | "KAKAO" | "ETC";
export type ContactResult =
  | "CONNECTED"
  | "NO_ANSWER"
  | "CALLBACK"
  | "CONSIDERING"
  | "PAYMENT_PROMISED"
  | "NOT_INTERESTED"
  | "SCHEDULE_CONFLICT"
  | "PRICE_OBJECTION"
  | "INVALID_NUMBER"
  | "INFO_SENT"
  | "OTHER";
export type FollowUpPriority = "HIGH" | "NORMAL" | "LOW";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  phone_normalized: string;
  email: string | null;
  region: string | null;
  source_type: LeadSourceType;
  source_detail: string | null;
  customer_type: CustomerType;
  memo: string | null;
  legacy_sheet: string | null;
  legacy_row: number | null;
  legacy_note: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Lead {
  id: string;
  customer_id: string;
  status: LeadStatus;
  source_type: LeadSourceType;
  source_detail: string | null;
  origin_instructor_name: string | null;
  origin_course_name: string | null;
  origin_attendance_date: string | null;
  origin_region: string | null;
  offered_course_name: string | null;
  offered_region: string | null;
  offered_date: string | null;
  owner_user_id: string | null;
  legacy_sheet: string | null;
  legacy_row: number | null;
  legacy_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  customer_id: string;
  lead_id: string | null;
  contact_round: number;
  contact_type: ContactType;
  contact_at: string | null;
  result: ContactResult;
  note: string | null;
  follow_up_required: boolean;
  follow_up_at: string | null;
  follow_up_reason: string | null;
  follow_up_priority: FollowUpPriority;
  follow_up_completed_at: string | null;
  follow_up_completed_by: string | null;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerCrmSummary {
  customer_id: string;
  name: string;
  phone: string;
  phone_normalized: string;
  email: string | null;
  region: string | null;
  source_type: LeadSourceType;
  source_detail: string | null;
  customer_type: CustomerType;
  customer_memo: string | null;
  created_at: string;
  lead_id: string | null;
  lead_status: LeadStatus | null;
  offered_course_name: string | null;
  offered_region: string | null;
  offered_date: string | null;
  lead_count: number;
  contact_count: number;
  last_contact_at: string | null;
  last_result: ContactResult | null;
  follow_up_consultation_id: string | null;
  follow_up_at: string | null;
  follow_up_reason: string | null;
  follow_up_priority: FollowUpPriority | null;
}

export interface FollowUpRow {
  consultation_id: string;
  customer_id: string;
  lead_id: string | null;
  name: string;
  phone: string;
  region: string | null;
  lead_status: LeadStatus | null;
  offered_course_name: string | null;
  offered_region: string | null;
  contact_round: number;
  previous_result: ContactResult;
  previous_note: string | null;
  follow_up_at: string;
  follow_up_reason: string | null;
  follow_up_priority: FollowUpPriority;
  due_bucket: "OVERDUE" | "TODAY" | "TOMORROW" | "THIS_WEEK" | "LATER";
}

export interface CustomerDetail {
  customer: Customer;
  leads: Lead[];
  consultations: Consultation[];
}

export type ImportBatchStatus = "UPLOADED" | "PARSED" | "CLASSIFYING" | "REVIEW" | "IMPORTING" | "COMPLETED" | "FAILED";
export type ImportRowStatus = "READY" | "NEEDS_REVIEW" | "ERROR" | "IMPORTED" | "SKIPPED";
export type ImportMatchType = "NEW" | "EXISTING" | "SAME_BATCH" | "INVALID_PHONE";
export type ImportReviewStatus = "PENDING" | "APPROVED" | "SKIPPED";
export type ImportSheetKind = "CRM" | "CONFIRMED";
export type ImportClassificationEngine = "RULES" | "AI" | "MANUAL";

export interface ImportClassification {
  result: ContactResult;
  lead_status: LeadStatus;
  follow_up_required: boolean;
  follow_up_at: string | null;
  follow_up_reason: string | null;
  follow_up_priority: FollowUpPriority;
  summary: string;
  signals: string[];
  confidence: number;
  needs_review: boolean;
}

export interface ImportContactEvent {
  round: number;
  contact_at: string | null;
  note: string | null;
}

export interface ImportNormalizedRow {
  name: string;
  phone: string;
  phone_normalized: string | null;
  email: string | null;
  region: string | null;
  source_type: LeadSourceType;
  source_detail: string;
  origin_instructor_name: string | null;
  origin_course_name: string | null;
  origin_attendance_date: string | null;
  origin_region: string | null;
  offered_course_name: string | null;
  offered_region: string | null;
  offered_date: string | null;
  contact_events: ImportContactEvent[];
  contact_dates: string[];
  legacy_note: string | null;
}

export interface ImportBatch {
  id: string;
  file_name: string;
  storage_path: string | null;
  file_sha256: string | null;
  status: ImportBatchStatus;
  source_label: string | null;
  sheet_count: number;
  total_rows: number;
  ready_rows: number;
  needs_review_rows: number;
  error_rows: number;
  approved_rows: number;
  imported_rows: number;
  skipped_rows: number;
  ai_classified_rows: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface ImportRow {
  id: string;
  batch_id: string;
  sheet_name: string;
  sheet_row: number;
  sheet_kind: ImportSheetKind;
  raw_data: Record<string, unknown>;
  normalized_data: ImportNormalizedRow;
  classification_data: ImportClassification;
  review_data: {
    normalized?: Partial<ImportNormalizedRow>;
    classification?: Partial<ImportClassification>;
  };
  classification_engine: ImportClassificationEngine;
  classification_confidence: number | null;
  match_type: ImportMatchType;
  matched_customer_id: string | null;
  batch_duplicate_of: string | null;
  match_context: { matched_name?: string | null };
  status: ImportRowStatus;
  review_status: ImportReviewStatus;
  error_message: string | null;
  imported_customer_id: string | null;
  imported_lead_id: string | null;
  imported_consultation_ids: string[];
  created_at: string;
  updated_at: string;
  imported_at: string | null;
}

export type CourseType = "ONE_DAY" | "ONLINE" | "INSTRUCTOR_TRAINING" | "CORPORATE" | "EXTERNAL_LECTURE" | "FREE_LECTURE";
export type CourseStatus = "DRAFT" | "RECRUITING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type VenueStatus = "NOT_REQUIRED" | "PENDING" | "CONFIRMED";
export type RestaurantStatus = VenueStatus;
export type EnrollmentStatus = "APPLIED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type EnrollmentPaymentStatus = "PENDING" | "DEPOSIT_PAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED";
export type EnrollmentAttendanceStatus = "EXPECTED" | "PRESENT" | "LATE" | "ABSENT";
export type CertificateStatus = "NOT_REQUIRED" | "PENDING" | "READY" | "ISSUED";
export type ChecklistStatus = "TODO" | "IN_PROGRESS" | "DONE" | "NOT_REQUIRED";

export interface CourseSession {
  id: string;
  course_id: string;
  session_no: number;
  title: string | null;
  start_at: string;
  end_at: string;
  meeting_url: string | null;
}

export interface CourseSummary {
  id: string;
  course_code: string;
  course_type: CourseType;
  title: string;
  region: string | null;
  start_at: string;
  end_at: string;
  capacity: number;
  base_price: number;
  status: CourseStatus;
  venue_status: VenueStatus;
  venue_name: string | null;
  restaurant_status: RestaurantStatus;
  restaurant_name: string | null;
  expected_attendees: number | null;
  applicant_count: number;
  paid_count: number;
  booked_revenue: number;
  collected_revenue: number;
  outstanding_amount: number;
  onsite_balance_count: number;
  fill_rate: number;
  readiness_percent: number;
  checklist_open_count: number;
  created_at: string;
  updated_at: string;
}

export interface CourseDetail extends CourseSummary {
  venue_address: string | null;
  restaurant_address: string | null;
  internal_memo: string | null;
  sessions: CourseSession[];
  checklist: CourseChecklistItem[];
  applicants: CourseApplicant[];
}

export interface CourseChecklistItem {
  id: string;
  course_id: string;
  item_type: string;
  label: string;
  status: ChecklistStatus;
  due_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  memo: string | null;
  sort_order: number;
}

export interface CourseApplicant {
  enrollment_id: string;
  course_id: string;
  customer_id: string;
  lead_id: string | null;
  enrollment_status: EnrollmentStatus;
  application_source: LeadSourceType;
  applied_at: string;
  list_price: number;
  discount_amount: number;
  final_price: number;
  discount_reason: string | null;
  payment_status: EnrollmentPaymentStatus;
  payment_due_at: string | null;
  requires_onsite_balance: boolean;
  gross_paid: number;
  gross_refunded: number;
  net_paid: number;
  outstanding_amount: number;
  display_payment_status: DisplayPaymentStatus;
  is_overdue: boolean;
  refund_request_id: string | null;
  refund_request_status: RefundRequestStatus | null;
  refund_requested_amount: number | null;
  refund_cancel_enrollment: boolean | null;
  attendance_status: EnrollmentAttendanceStatus;
  certificate_status: CertificateStatus;
  memo: string | null;
  customer_name: string;
  phone: string;
  phone_normalized: string;
  customer_region: string | null;
}

export interface CustomerSearchOption {
  id: string;
  name: string;
  phone: string;
  region: string | null;
  leads: Array<{ id: string; status: LeadStatus; offered_course_name: string | null; offered_region: string | null }>;
}

export type PaymentTransactionType = "PAYMENT" | "REFUND";
export type PaymentStage = "DEPOSIT" | "PARTIAL" | "BALANCE" | "FULL" | "REFUND";
export type PaymentMethod = "BANK" | "CARD" | "ON_SITE_CARD" | "CASH" | "ETC";
export type PaymentTransactionStatus = "POSTED" | "VOIDED";
export type RefundRequestStatus = "REQUESTED" | "APPROVED" | "COMPLETED" | "CANCELLED";
export type DisplayPaymentStatus =
  | "PAYMENT_PENDING"
  | "DEPOSIT_PAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "REFUND_REQUESTED"
  | "PARTIALLY_REFUNDED"
  | "FULLY_REFUNDED";
export type AttendanceRecordStatus = "EXPECTED" | "PRESENT" | "LATE" | "ABSENT";

export interface PaymentTransaction {
  id: string;
  enrollment_id: string;
  course_id: string;
  registered_customer_id: string;
  registered_customer_name: string;
  payer_name: string;
  transaction_type: PaymentTransactionType;
  payment_stage: PaymentStage;
  payment_method: PaymentMethod;
  amount: number;
  status: PaymentTransactionStatus;
  paid_at: string;
  reference_no: string | null;
  memo: string | null;
  created_by: string;
  created_at: string;
}

export interface EnrollmentFinancialSummary {
  enrollment_id: string;
  course_id: string;
  customer_id: string;
  enrollment_status: EnrollmentStatus;
  payment_status: EnrollmentPaymentStatus;
  final_price: number;
  payment_due_at: string | null;
  requires_onsite_balance: boolean;
  customer_name: string;
  phone: string;
  phone_normalized: string;
  customer_region: string | null;
  gross_paid: number;
  gross_refunded: number;
  net_paid: number;
  outstanding_amount: number;
  transaction_count: number;
  last_transaction_at: string | null;
  refund_request_id: string | null;
  refund_request_status: RefundRequestStatus | null;
  refund_requested_amount: number | null;
  refund_cancel_enrollment: boolean | null;
  display_payment_status: DisplayPaymentStatus;
  is_overdue: boolean;
}

export interface EventRosterRow {
  enrollment_id: string;
  course_id: string;
  customer_id: string;
  customer_name: string;
  phone: string;
  phone_normalized: string;
  final_price: number;
  gross_paid: number;
  gross_refunded: number;
  net_paid: number;
  outstanding_amount: number;
  display_payment_status: DisplayPaymentStatus;
  requires_onsite_balance: boolean;
  payment_due_at: string | null;
  session_id: string;
  session_no: number;
  session_start_at: string;
  session_end_at: string;
  attendance_status: AttendanceRecordStatus;
  check_in_at: string | null;
  attendance_note: string | null;
}

export interface OutstandingPayment extends EnrollmentFinancialSummary {
  course_title: string;
  course_type: CourseType;
  course_region: string | null;
  course_start_at: string;
}

export type InstructorStage = "APPLIED" | "TRAINING" | "DEMO" | "EVALUATION" | "APPROVED" | "ACTIVE" | "TOP_INSTRUCTOR";
export type InstructorActiveStatus = "ACTIVE" | "PAUSED" | "INACTIVE";
export type InstructorAvailabilityStatus = "AVAILABLE" | "UNAVAILABLE" | "TENTATIVE";
export type InstructorAssignmentRole = "PRIMARY" | "ASSISTANT";
export type InstructorAssignmentStatus = "REQUESTED" | "AVAILABLE" | "DECLINED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type InstructorCandidateStatus = "AVAILABLE" | "TENTATIVE" | "UNKNOWN" | "UNAVAILABLE" | "CONFLICT";

export interface InstructorSummary {
  id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  stage: InstructorStage;
  active_status: InstructorActiveStatus;
  home_region: string | null;
  available_regions: string[];
  specialties: string[];
  lecture_types: string[];
  base_fee: number;
  rating: number;
  satisfaction: number;
  memo: string | null;
  login_account_status: AccountStatus | null;
  login_permission: PermissionLevel | null;
  confirmed_class_count: number;
  next_class_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstructorAvailability {
  id: string;
  instructor_id: string;
  start_at: string;
  end_at: string;
  status: InstructorAvailabilityStatus;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstructorAssignmentDetail {
  assignment_id: string;
  course_id: string;
  instructor_id: string;
  role: InstructorAssignmentRole;
  status: InstructorAssignmentStatus;
  fee: number;
  requested_at: string;
  responded_at: string | null;
  confirmed_at: string | null;
  response_note: string | null;
  memo: string | null;
  instructor_name: string;
  instructor_phone: string | null;
  instructor_home_region: string | null;
  course_type: CourseType;
  course_title: string;
  course_region: string | null;
  start_at: string;
  end_at: string;
  venue_name: string | null;
  venue_address: string | null;
  course_status: CourseStatus;
}

export interface FreeClassScheduleRow {
  course_id: string;
  title: string;
  region: string | null;
  start_at: string;
  end_at: string;
  course_status: CourseStatus;
  venue_name: string | null;
  venue_address: string | null;
  expected_attendees: number | null;
  assignment_id: string | null;
  instructor_id: string | null;
  assignment_role: InstructorAssignmentRole | null;
  assignment_status: InstructorAssignmentStatus | null;
  instructor_fee: number | null;
  instructor_name: string | null;
}

export interface InstructorCandidate {
  instructor_id: string;
  name: string;
  home_region: string | null;
  available_regions: string[];
  specialties: string[];
  base_fee: number;
  rating: number;
  satisfaction: number;
  candidate_status: InstructorCandidateStatus;
  region_match: boolean;
  assignment_id: string | null;
  assignment_status: InstructorAssignmentStatus | null;
}

export interface InstructorPortalProfileOption {
  profile_id: string;
  name: string;
  phone: string | null;
  account_status: AccountStatus;
}
