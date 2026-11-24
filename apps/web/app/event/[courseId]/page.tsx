import { notFound,redirect } from "next/navigation";
import { EventModeWorkspace } from "@/features/programs/components/event-mode-workspace";
import { getCourseDetail,getCourseEventRoster } from "@/features/programs/queries";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canAccessAdminDashboard,canEditOperations } from "@/lib/permissions";

export default async function EventPage({params,searchParams}:{params:Promise<{courseId:string}>;searchParams:Promise<{session?:string}>}){
  const [{courseId},{session},profile]=await Promise.all([params,searchParams,requireActiveProfile()]);
  if(!canAccessAdminDashboard(profile))redirect("/instructor/home");
  const [course,roster]=await Promise.all([getCourseDetail(courseId),getCourseEventRoster(courseId)]);
  if(!course)notFound();
  if(course.course_type==="FREE_LECTURE")redirect(`/programs/${courseId}`);
  const initialSession=course.sessions.some(s=>s.id===session)?session:course.sessions[0]?.id;
  return <EventModeWorkspace course={course} roster={roster} canEdit={canEditOperations(profile)} initialSessionId={initialSession??""}/>;
}
