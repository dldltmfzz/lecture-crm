import { InstructorPortalAvailability } from "@/features/instructors/components/instructor-portal-availability";
import { ConnectionPending } from "@/features/instructors/components/portal-states";
import { getCurrentInstructor, getInstructorAvailabilityRange } from "@/features/instructors/queries";
export default async function AvailabilityPage(){const instructor=await getCurrentInstructor();if(!instructor)return <ConnectionPending/>;const start=new Date();start.setDate(start.getDate()-7);const end=new Date();end.setDate(end.getDate()+120);const rows=await getInstructorAvailabilityRange(start.toISOString(),end.toISOString(),instructor.id);return <InstructorPortalAvailability rows={rows}/>}
