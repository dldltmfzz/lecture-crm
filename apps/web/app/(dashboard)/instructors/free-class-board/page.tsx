import { PageHeader } from "@/components/common/page-header";
import { InstructorAdminNav } from "@/features/instructors/components/instructor-admin-nav";
import { FreeClassBoard } from "@/features/instructors/components/free-class-board";
import { getFreeClassSchedule } from "@/features/instructors/queries";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canEditOperations } from "@/lib/permissions";

export default async function FreeClassBoardPage(){
  const profile=await requireActiveProfile();const now=new Date();const start=new Date(now);start.setDate(start.getDate()-60);const end=new Date(now);end.setDate(end.getDate()+210);
  const rows=await getFreeClassSchedule(start.toISOString(),end.toISOString());
  return <div className="space-y-7"><PageHeader eyebrow="INSTRUCTOR OPERATIONS" title="Free Class Board" description="무료강의 일정과 강사 배정 상태를 월·주·리스트 형태로 확인합니다."/><InstructorAdminNav/><FreeClassBoard rows={rows} canEdit={canEditOperations(profile)}/></div>
}
