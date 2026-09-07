import { PageHeader } from "@/components/common/page-header";
import { InstructorAdminNav } from "@/features/instructors/components/instructor-admin-nav";
import { InstructorDirectoryWorkspace } from "@/features/instructors/components/instructor-directory-workspace";
import { getInstructorDirectory, getUnlinkedInstructorProfiles } from "@/features/instructors/queries";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canEditOperations, canManageInstructorAccounts } from "@/lib/permissions";

export default async function InstructorsPage(){
  const profile=await requireActiveProfile();const canEdit=canEditOperations(profile);const canManageAccounts=canManageInstructorAccounts(profile);
  const [instructors,portalProfiles]=await Promise.all([getInstructorDirectory(),canManageAccounts?getUnlinkedInstructorProfiles():Promise.resolve([])]);
  return <div className="space-y-7"><PageHeader eyebrow="INSTRUCTOR OPERATIONS" title="Instructors" description="강사 풀, 로그인 연결, 활동지역과 전문분야를 한 곳에서 관리합니다."/><InstructorAdminNav/><InstructorDirectoryWorkspace instructors={instructors} portalProfiles={portalProfiles} canEdit={canEdit} canManageAccounts={canManageAccounts}/></div>
}
