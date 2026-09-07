import { notFound } from "next/navigation";
import { CourseDetailWorkspace } from "@/features/programs/components/course-detail-workspace";
import { getCourseDetail,getCourseEventRoster,getCoursePaymentTransactions } from "@/features/programs/queries";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canEditOperations,canManageFinance } from "@/lib/permissions";

export default async function CoursePage({params}:{params:Promise<{courseId:string}>}){
  const {courseId}=await params;
  const [course,transactions,eventRoster,profile]=await Promise.all([getCourseDetail(courseId),getCoursePaymentTransactions(courseId),getCourseEventRoster(courseId),requireActiveProfile()]);
  if(!course)notFound();
  return <CourseDetailWorkspace course={course} transactions={transactions} eventRoster={eventRoster} canEdit={canEditOperations(profile)} canManageFinance={canManageFinance(profile)}/>;
}
