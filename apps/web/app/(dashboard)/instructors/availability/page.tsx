import { PageHeader } from "@/components/common/page-header";
import { InstructorAdminNav } from "@/features/instructors/components/instructor-admin-nav";
import { InstructorAvailabilityBoard } from "@/features/instructors/components/instructor-availability-board";
import { getInstructorAssignments, getInstructorAvailabilityRange, getInstructorDirectory } from "@/features/instructors/queries";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canEditOperations } from "@/lib/permissions";

export default async function InstructorAvailabilityPage(){
  const profile=await requireActiveProfile();const start=new Date();start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+15);
  const [instructors,availability,assignments]=await Promise.all([getInstructorDirectory(),getInstructorAvailabilityRange(start.toISOString(),end.toISOString()),getInstructorAssignments({includePast:false})]);
  return <div className="space-y-7"><PageHeader eyebrow="INSTRUCTOR OPERATIONS" title="Availability" description="앞으로 2주간 강사 가능/불가능 일정과 이미 확정된 강의를 한 눈에 확인합니다."/><InstructorAdminNav/><InstructorAvailabilityBoard instructors={instructors} availability={availability} assignments={assignments} canEdit={canEditOperations(profile)}/></div>
}
