import type { InstructorActiveStatus, InstructorAssignmentStatus, InstructorAvailabilityStatus, InstructorCandidateStatus, InstructorStage } from "@aileaders/domain";

export const instructorStageLabels:Record<InstructorStage,string>={APPLIED:"지원",TRAINING:"교육중",DEMO:"시범강의",EVALUATION:"평가",APPROVED:"승인",ACTIVE:"활동강사",TOP_INSTRUCTOR:"우수강사"};
export const instructorActiveLabels:Record<InstructorActiveStatus,string>={ACTIVE:"활동",PAUSED:"휴면",INACTIVE:"중단"};
export const availabilityLabels:Record<InstructorAvailabilityStatus,string>={AVAILABLE:"가능",UNAVAILABLE:"불가능",TENTATIVE:"미정"};
export const assignmentLabels:Record<InstructorAssignmentStatus,string>={REQUESTED:"응답 대기",AVAILABLE:"가능 응답",DECLINED:"불가 응답",CONFIRMED:"확정",COMPLETED:"완료",CANCELLED:"취소"};
export const candidateLabels:Record<InstructorCandidateStatus,string>={AVAILABLE:"가능",TENTATIVE:"미정",UNKNOWN:"일정 미입력",UNAVAILABLE:"불가능",CONFLICT:"다른 강의"};
export const assignmentTones:Record<InstructorAssignmentStatus,"success"|"warning"|"danger"|"info"|"neutral">={REQUESTED:"warning",AVAILABLE:"info",DECLINED:"danger",CONFIRMED:"success",COMPLETED:"neutral",CANCELLED:"neutral"};
export const candidateTones:Record<InstructorCandidateStatus,"success"|"warning"|"danger"|"info"|"neutral">={AVAILABLE:"success",TENTATIVE:"warning",UNKNOWN:"neutral",UNAVAILABLE:"danger",CONFLICT:"danger"};
