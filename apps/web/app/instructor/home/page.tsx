import { InstructorPortalHome } from "@/features/instructors/components/instructor-portal-home";
import { getCurrentInstructor, getInstructorAssignments } from "@/features/instructors/queries";
import { ConnectionPending } from "@/features/instructors/components/portal-states";
export default async function InstructorHomePage(){const instructor=await getCurrentInstructor();if(!instructor)return <ConnectionPending/>;const assignments=await getInstructorAssignments({instructorId:instructor.id,includePast:false});return <InstructorPortalHome instructor={instructor} assignments={assignments}/>}
