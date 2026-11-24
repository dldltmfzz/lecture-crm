"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLeadAction } from "@/features/customers/actions";
import { sourceLabels } from "@/features/customers/constants";

export function LeadModal({ open, customerId, onClose, onSaved }: { open: boolean; customerId: string; onClose: () => void; onSaved: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  if (!open) return null;

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createLeadAction(Object.fromEntries(formData.entries()));
      if (!result.ok) { setError(result.error); return; }
      onSaved();
      router.refresh();
      onClose();
    });
  }

  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-6" onMouseDown={onClose}>
    <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] border border-white/10 bg-[#171A20] p-5 shadow-2xl md:max-w-[620px] md:rounded-[20px] md:p-6" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between"><div><div className="text-[11px] font-semibold tracking-[.18em] text-[#7C5CFF]">NEW LEAD</div><h2 className="mt-1 text-lg font-semibold">관심 과정 추가</h2><p className="mt-1 text-xs text-[#686F7D]">기존 고객을 중복 생성하지 않고 새로운 상담 기회만 추가합니다.</p></div><button onClick={onClose} className="rounded-lg p-2 text-[#686F7D] hover:bg-white/5" aria-label="닫기"><X size={18}/></button></div>
      <form action={submit} className="mt-6 space-y-4">
        <input type="hidden" name="customer_id" value={customerId}/>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="유입 경로"><select name="source_type" defaultValue="MANUAL" className={inputClass}>{Object.entries(sourceLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="유입 상세"><input name="source_detail" className={inputClass} placeholder="예: 제주 현장 / 홈페이지"/></Field>
          <Field label="유입 강사"><input name="origin_instructor_name" className={inputClass} placeholder="예: 아이온"/></Field>
          <Field label="유입 강의명"><input name="origin_course_name" className={inputClass} placeholder="AI 활용 실무 과정"/></Field>
          <Field label="유입 강의 참석일"><input name="origin_attendance_date" type="date" className={inputClass}/></Field>
          <Field label="유입 지역"><input name="origin_region" className={inputClass} placeholder="제주"/></Field>
          <Field label="안내할 과정"><input name="offered_course_name" className={inputClass} placeholder="원데이 클래스"/></Field>
          <Field label="안내 지역"><input name="offered_region" className={inputClass} placeholder="서울 / 제주"/></Field>
          <Field label="안내 일정"><input name="offered_date" type="date" className={inputClass}/></Field>
        </div>
        <Field label="원본/특이 메모"><textarea name="legacy_note" className={`${inputClass} min-h-24 resize-y py-3`} placeholder="필요한 경우 기존 메모를 남겨두세요."/></Field>
        {error ? <div className="rounded-[12px] border border-[#FF5C5C]/25 bg-[#FF5C5C]/8 p-3 text-sm text-[#FF7A7A]">{error}</div> : null}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>취소</Button><Button type="submit" disabled={isPending}>{isPending ? "추가 중..." : "관심 과정 추가"}</Button></div>
      </form>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-medium text-[#A3A9B5]"><span>{label}</span><div className="mt-2">{children}</div></label>; }
const inputClass = "h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 text-sm text-[#F5F7FA] outline-none transition placeholder:text-[#484E59] focus:border-[#7C5CFF]";
