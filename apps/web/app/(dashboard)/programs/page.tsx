import { ProgramWorkspace } from "@/features/programs/components/program-workspace";
import { getCourseSummaries } from "@/features/programs/queries";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canEditOperations } from "@/lib/permissions";

export default async function ProgramsPage(){const [courses,profile]=await Promise.all([getCourseSummaries(),requireActiveProfile()]);return <ProgramWorkspace courses={courses} canEdit={canEditOperations(profile)}/>}
