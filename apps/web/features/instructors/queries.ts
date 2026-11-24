import type {
  FreeClassScheduleRow,
  InstructorAssignmentDetail,
  InstructorAvailability,
  InstructorCandidate,
  InstructorPortalProfileOption,
  InstructorSummary,
} from "@aileaders/domain";
import { createClient } from "@/lib/supabase/server";

const num = (value: unknown) => Number(value ?? 0);

export async function getInstructorDirectory(): Promise<InstructorSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_instructor_directory").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...(row as unknown as InstructorSummary),
    available_regions: (row.available_regions ?? []) as string[],
    specialties: (row.specialties ?? []) as string[],
    lecture_types: (row.lecture_types ?? []) as string[],
    base_fee: num(row.base_fee), rating: num(row.rating), satisfaction: num(row.satisfaction),
    confirmed_class_count: num(row.confirmed_class_count),
  }));
}

export async function getFreeClassSchedule(startAt?: string, endAt?: string): Promise<FreeClassScheduleRow[]> {
  const supabase = await createClient();
  let request = supabase.from("v_free_class_schedule").select("*").order("start_at");
  if (startAt) request = request.gte("start_at", startAt);
  if (endAt) request = request.lt("start_at", endAt);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...(row as unknown as FreeClassScheduleRow),
    expected_attendees: row.expected_attendees == null ? null : num(row.expected_attendees),
    instructor_fee: row.instructor_fee == null ? null : num(row.instructor_fee),
  }));
}

export async function getInstructorAvailabilityRange(startAt: string, endAt: string, instructorId?: string): Promise<InstructorAvailability[]> {
  const supabase = await createClient();
  let request = supabase.from("instructor_availability").select("*").lt("start_at", endAt).gt("end_at", startAt).order("start_at");
  if (instructorId) request = request.eq("instructor_id", instructorId);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []) as InstructorAvailability[];
}

export async function getInstructorAssignments(options?: { instructorId?: string; courseType?: string; includePast?: boolean }): Promise<InstructorAssignmentDetail[]> {
  const supabase = await createClient();
  let request = supabase.from("v_instructor_assignment_details").select("*").order("start_at", { ascending: true });
  if (options?.instructorId) request = request.eq("instructor_id", options.instructorId);
  if (options?.courseType) request = request.eq("course_type", options.courseType);
  if (!options?.includePast) request = request.gte("end_at", new Date().toISOString());
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...(row as unknown as InstructorAssignmentDetail), fee: num(row.fee) }));
}

export async function getInstructorCandidates(courseId: string): Promise<InstructorCandidate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_instructor_candidates", { p_course_id: courseId });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as InstructorCandidate),
    available_regions: (row.available_regions ?? []) as string[], specialties: (row.specialties ?? []) as string[],
    base_fee: num(row.base_fee), rating: num(row.rating), satisfaction: num(row.satisfaction),
  }));
}

export async function getUnlinkedInstructorProfiles(): Promise<InstructorPortalProfileOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_unlinked_instructor_profiles");
  if (error) throw new Error(error.message);
  return (data ?? []) as InstructorPortalProfileOption[];
}

export async function getCurrentInstructor(): Promise<InstructorSummary | null> {
  const supabase = await createClient();
  const { data: instructorId, error: idError } = await supabase.rpc("current_instructor_id");
  if (idError) throw new Error(idError.message);
  if (!instructorId) return null;
  const { data, error } = await supabase.from("v_instructor_directory").select("*").eq("id", instructorId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    ...(data as unknown as InstructorSummary),
    available_regions: (data.available_regions ?? []) as string[], specialties: (data.specialties ?? []) as string[], lecture_types: (data.lecture_types ?? []) as string[],
    base_fee: num(data.base_fee), rating: num(data.rating), satisfaction: num(data.satisfaction), confirmed_class_count: num(data.confirmed_class_count),
  };
}
