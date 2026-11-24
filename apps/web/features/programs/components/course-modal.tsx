"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  CourseDetail,
  CourseStatus,
  CourseType,
  VenueStatus,
} from "@aileaders/domain";
import { CalendarPlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createCourseAction,
  updateCourseAction,
} from "@/features/programs/actions";
import {
  courseStatusLabels,
  courseTypeLabels,
} from "@/features/programs/constants";

type SessionDraft = {
  session_no: number;
  title: string;
  start_at: string;
  end_at: string;
  meeting_url: string;
};
const localInput = (iso: string) => {
  const d = new Date(iso);
  const f = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return f.replace(" ", "T");
};

export function CourseModal({
  open,
  onClose,
  course,
}: {
  open: boolean;
  onClose: () => void;
  course?: CourseDetail | null;
}) {
  if (!open) return null;

  return (
    <CourseModalContent
      key={course?.id ?? "new"}
      onClose={onClose}
      course={course}
    />
  );
}

function CourseModalContent({
  onClose,
  course,
}: {
  onClose: () => void;
  course?: CourseDetail | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [type, setType] = useState<CourseType>(
    () => course?.course_type ?? "ONE_DAY",
  );
  const [sessions, setSessions] = useState<SessionDraft[]>(() =>
    course
      ? course.sessions.map((s) => ({
          session_no: s.session_no,
          title: s.title ?? "",
          start_at: localInput(s.start_at),
          end_at: localInput(s.end_at),
          meeting_url: s.meeting_url ?? "",
        }))
      : [],
  );
  const initialStart = course ? localInput(course.start_at) : "";
  const initialEnd = course ? localInput(course.end_at) : "";
  const addSession = () =>
    setSessions((p) => [
      ...p,
      {
        session_no: p.length + 1,
        title: `${p.length + 1}회차`,
        start_at: p.at(-1)?.start_at ?? initialStart,
        end_at: p.at(-1)?.end_at ?? initialEnd,
        meeting_url: "",
      },
    ]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-[22px] border border-white/10 bg-[#111318] p-5 shadow-2xl md:max-w-[780px] md:rounded-[22px] md:p-7"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          const fd = new FormData(e.currentTarget);
          const input = {
            course_code:
              course?.course_code || String(fd.get("course_code") || ""),
            course_type: type,
            title: String(fd.get("title") || ""),
            region: String(fd.get("region") || ""),
            start_at: String(fd.get("start_at") || ""),
            end_at: String(fd.get("end_at") || ""),
            capacity: Number(fd.get("capacity") || 0),
            base_price: Number(fd.get("base_price") || 0),
            status: String(fd.get("status") || "DRAFT") as CourseStatus,
            venue_status: String(
              fd.get("venue_status") || "PENDING",
            ) as VenueStatus,
            venue_name: String(fd.get("venue_name") || ""),
            venue_address: String(fd.get("venue_address") || ""),
            restaurant_status: String(
              fd.get("restaurant_status") || "PENDING",
            ) as VenueStatus,
            restaurant_name: String(fd.get("restaurant_name") || ""),
            restaurant_address: String(fd.get("restaurant_address") || ""),
            expected_attendees: fd.get("expected_attendees")
              ? Number(fd.get("expected_attendees"))
              : null,
            internal_memo: String(fd.get("internal_memo") || ""),
            sessions,
          };
          startTransition(async () => {
            if (course) {
              const result = await updateCourseAction(course.id, input);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              onClose();
              router.push(`/programs/${course.id}`);
              router.refresh();
              return;
            }
            const result = await createCourseAction(input);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            onClose();
            router.push(`/programs/${result.data.courseId}`);
            router.refresh();
          });
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-[.18em] text-[#7C5CFF]">
              PROGRAM
            </div>
            <h2 className="mt-2 text-2xl font-semibold">
              {course ? "강의 수정" : "새 강의 개설"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#686F7D] hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {!course ? (
            <Field label="강의 코드">
              <input
                name="course_code"
                placeholder="비워두면 자동 생성"
                className={inputCls}
              />
            </Field>
          ) : null}
          <Field label="강의 유형">
            <select
              value={type}
              onChange={(e) => {
                const next = e.target.value as CourseType;
                setType(next);
                if (
                  !course &&
                  sessions.length === 0 &&
                  (next === "ONLINE" || next === "INSTRUCTOR_TRAINING")
                ) {
                  const count = next === "ONLINE" ? 3 : 5;
                  setSessions(
                    Array.from({ length: count }, (_, i) => ({
                      session_no: i + 1,
                      title: `${i + 1}회차`,
                      start_at: "",
                      end_at: "",
                      meeting_url: "",
                    })),
                  );
                }
              }}
              className={inputCls}
            >
              {Object.entries(courseTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="강의명" wide>
            <input
              name="title"
              defaultValue={course?.title}
              required
              placeholder="AI 원데이 클래스"
              className={inputCls}
            />
          </Field>
          <Field label="지역">
            <input
              name="region"
              defaultValue={course?.region ?? ""}
              placeholder="서울"
              className={inputCls}
            />
          </Field>
          <Field label="상태">
            <select
              name="status"
              defaultValue={course?.status ?? "DRAFT"}
              className={inputCls}
            >
              {Object.entries(courseStatusLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="시작">
            <input
              type="datetime-local"
              name="start_at"
              defaultValue={initialStart}
              required
              className={inputCls}
            />
          </Field>
          <Field label="종료">
            <input
              type="datetime-local"
              name="end_at"
              defaultValue={initialEnd}
              required
              className={inputCls}
            />
          </Field>
          <Field label="정원">
            <input
              type="number"
              name="capacity"
              min="0"
              defaultValue={course?.capacity ?? 30}
              className={inputCls}
            />
          </Field>
          <Field label="기본 수강료">
            <input
              type="number"
              name="base_price"
              min="0"
              step="1000"
              defaultValue={course?.base_price ?? 300000}
              className={inputCls}
            />
          </Field>
          <Field label="예상 참석 인원">
            <input
              type="number"
              name="expected_attendees"
              min="0"
              defaultValue={course?.expected_attendees ?? ""}
              className={inputCls}
            />
          </Field>
        </div>
        <Section title="장소">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="대관 상태">
              <select
                key={`venue-${type}`}
                name="venue_status"
                defaultValue={
                  course?.venue_status ??
                  (type === "ONLINE" ? "NOT_REQUIRED" : "PENDING")
                }
                className={inputCls}
              >
                <StatusOptions />
              </select>
            </Field>
            <Field label="장소명">
              <input
                name="venue_name"
                defaultValue={course?.venue_name ?? ""}
                className={inputCls}
              />
            </Field>
            <Field label="주소">
              <input
                name="venue_address"
                defaultValue={course?.venue_address ?? ""}
                className={inputCls}
              />
            </Field>
          </div>
        </Section>
        <Section title="식당">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="예약 상태">
              <select
                key={`restaurant-${type}`}
                name="restaurant_status"
                defaultValue={
                  course?.restaurant_status ??
                  (type === "ONLINE" ||
                  type === "FREE_LECTURE" ||
                  type === "CORPORATE" ||
                  type === "EXTERNAL_LECTURE"
                    ? "NOT_REQUIRED"
                    : "PENDING")
                }
                className={inputCls}
              >
                <StatusOptions />
              </select>
            </Field>
            <Field label="식당명">
              <input
                name="restaurant_name"
                defaultValue={course?.restaurant_name ?? ""}
                className={inputCls}
              />
            </Field>
            <Field label="주소">
              <input
                name="restaurant_address"
                defaultValue={course?.restaurant_address ?? ""}
                className={inputCls}
              />
            </Field>
          </div>
        </Section>
        {type === "ONLINE" || type === "INSTRUCTOR_TRAINING" ? (
          <Section
            title="회차 일정"
            action={
              <Button type="button" variant="secondary" onClick={addSession}>
                <Plus size={15} className="mr-1" />
                회차 추가
              </Button>
            }
          >
            <div className="space-y-3">
              {sessions.map((s, i) => (
                <div
                  key={`${s.session_no}-${i}`}
                  className="grid gap-3 rounded-xl border border-white/8 bg-[#0D0F13] p-4 md:grid-cols-[70px_1fr_1fr_1fr_40px]"
                >
                  <div className="text-sm font-semibold pt-3">{i + 1}회차</div>
                  <input
                    value={s.start_at}
                    type="datetime-local"
                    onChange={(e) =>
                      setSessions((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, start_at: e.target.value } : x,
                        ),
                      )
                    }
                    className={inputCls}
                  />
                  <input
                    value={s.end_at}
                    type="datetime-local"
                    onChange={(e) =>
                      setSessions((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, end_at: e.target.value } : x,
                        ),
                      )
                    }
                    className={inputCls}
                  />
                  <input
                    value={s.meeting_url}
                    placeholder="Zoom URL"
                    onChange={(e) =>
                      setSessions((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, meeting_url: e.target.value } : x,
                        ),
                      )
                    }
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSessions((p) =>
                        p
                          .filter((_, j) => j !== i)
                          .map((x, j) => ({ ...x, session_no: j + 1 })),
                      )
                    }
                    className="text-[#686F7D] hover:text-[#FF5C5C]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {sessions.length === 0 ? (
                <button
                  type="button"
                  onClick={addSession}
                  className="w-full rounded-xl border border-dashed border-white/10 p-5 text-sm text-[#686F7D] hover:border-[#7C5CFF]/40 hover:text-white"
                >
                  <CalendarPlus size={17} className="mx-auto mb-2" />
                  회차를 추가하세요.
                </button>
              ) : null}
            </div>
          </Section>
        ) : null}
        <Section title="내부 메모">
          <textarea
            name="internal_memo"
            defaultValue={course?.internal_memo ?? ""}
            rows={3}
            className={`${inputCls} h-auto py-3`}
          />
        </Section>
        {error ? (
          <div className="mt-4 rounded-xl border border-[#FF5C5C]/20 bg-[#FF5C5C]/10 p-3 text-sm text-[#FF7A7A]">
            {error}
          </div>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button disabled={pending}>
            {pending ? "저장 중..." : course ? "변경 저장" : "강의 생성"}
          </Button>
        </div>
      </form>
    </div>
  );
}
const inputCls =
  "h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 text-sm outline-none focus:border-[#7C5CFF]";
function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "md:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs font-medium text-[#A3A9B5]">
        {label}
      </span>
      {children}
    </label>
  );
}
function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 border-t border-white/8 pt-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
function StatusOptions() {
  return (
    <>
      <option value="PENDING">미정/진행중</option>
      <option value="CONFIRMED">확정</option>
      <option value="NOT_REQUIRED">필요없음</option>
    </>
  );
}
