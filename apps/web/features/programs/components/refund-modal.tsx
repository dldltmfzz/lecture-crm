"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CourseApplicant, PaymentMethod } from "@aileaders/domain";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  recordRefundAction,
  requestRefundAction,
} from "@/features/programs/actions";
import { paymentMethodLabels } from "@/features/programs/constants";

export function RefundModal({
  open,
  onClose,
  courseId,
  applicant,
  canProcess,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  applicant: CourseApplicant | null;
  canProcess: boolean;
}) {
  if (!open || !applicant) return null;

  return (
    <RefundModalContent
      key={`${applicant.enrollment_id}-${applicant.refund_request_id ?? "new"}`}
      onClose={onClose}
      courseId={courseId}
      applicant={applicant}
      canProcess={canProcess}
    />
  );
}

function RefundModalContent({
  onClose,
  courseId,
  applicant,
  canProcess,
}: {
  onClose: () => void;
  courseId: string;
  applicant: CourseApplicant;
  canProcess: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"REQUEST" | "PROCESS">(() =>
    applicant.refund_request_id && canProcess ? "PROCESS" : "REQUEST",
  );
  const [amount, setAmount] = useState(
    () => applicant.refund_requested_amount ?? applicant.net_paid,
  );
  const [reason, setReason] = useState("");
  const [cancel, setCancel] = useState(() =>
    applicant.refund_request_id
      ? Boolean(applicant.refund_cancel_enrollment)
      : (applicant.refund_requested_amount ?? applicant.net_paid) >=
        applicant.net_paid,
  );
  const [method, setMethod] = useState<PaymentMethod>("BANK");
  const [paidAt, setPaidAt] = useState(nowLocal);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center md:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const fd = new FormData(e.currentTarget);
            const r =
              mode === "REQUEST"
                ? await requestRefundAction(courseId, {
                    enrollment_id: applicant.enrollment_id,
                    requested_amount: amount,
                    reason,
                    cancel_enrollment: cancel,
                    memo: String(fd.get("memo") || ""),
                  })
                : await recordRefundAction(courseId, {
                    enrollment_id: applicant.enrollment_id,
                    refund_request_id: applicant.refund_request_id ?? "",
                    amount,
                    payment_method: method,
                    paid_at: paidAt,
                    cancel_enrollment: cancel,
                    reference_no: String(fd.get("reference_no") || ""),
                    memo: String(fd.get("memo") || ""),
                  });
            if (!r.ok) {
              setError(r.error);
              return;
            }
            onClose();
            router.refresh();
          });
        }}
        className="w-full rounded-t-[22px] border border-white/10 bg-[#111318] p-5 md:max-w-[560px] md:rounded-[22px] md:p-7"
      >
        <div className="flex justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-[.18em] text-[#FF7A7A]">
              REFUND
            </div>
            <h2 className="mt-2 text-2xl font-semibold">환불 관리</h2>
            <p className="mt-1 text-sm text-[#686F7D]">
              {applicant.customer_name} · 실결제 {won(applicant.net_paid)}
            </p>
          </div>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 rounded-xl bg-[#0D0F13] p-1">
          <button
            type="button"
            onClick={() => setMode("REQUEST")}
            className={`rounded-lg py-2 text-xs font-semibold ${mode === "REQUEST" ? "bg-white/8 text-white" : "text-[#686F7D]"}`}
          >
            환불 요청
          </button>
          {canProcess ? (
            <button
              type="button"
              onClick={() => setMode("PROCESS")}
              className={`rounded-lg py-2 text-xs font-semibold ${mode === "PROCESS" ? "bg-white/8 text-white" : "text-[#686F7D]"}`}
            >
              환불 처리
            </button>
          ) : (
            <div className="rounded-lg py-2 text-center text-xs text-[#686F7D]">
              집행 권한 없음
            </div>
          )}
        </div>
        <Field label="환불 금액">
          <input
            type="number"
            min="1"
            max={applicant.net_paid}
            step="1000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className={inputCls}
          />
        </Field>
        {mode === "REQUEST" ? (
          <Field label="환불 사유">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={`${inputCls} h-auto py-3`}
            />
          </Field>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="환불 수단">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className={inputCls}
              >
                {Object.entries(paymentMethodLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="환불 처리일">
              <input
                type="datetime-local"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="환불 참고번호">
              <input name="reference_no" className={inputCls} />
            </Field>
          </div>
        )}
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-white/8 bg-[#0D0F13] p-4">
          <input
            type="checkbox"
            checked={cancel}
            onChange={(e) => setCancel(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-semibold">
              이 수강 신청도 취소
            </span>
            <span className="mt-1 block text-xs text-[#686F7D]">
              체크하면 미수금과 현장 잔금 대상에서도 제외됩니다.
            </span>
          </span>
        </label>
        <Field label="메모">
          <textarea
            name="memo"
            rows={2}
            className={`${inputCls} h-auto py-3`}
          />
        </Field>
        {error ? (
          <div className="mt-4 rounded-xl bg-[#FF5C5C]/10 p-3 text-sm text-[#FF7A7A]">
            {error}
          </div>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="danger"
            disabled={
              pending ||
              amount <= 0 ||
              (mode === "REQUEST" && reason.trim().length < 2)
            }
          >
            {pending
              ? "처리 중..."
              : mode === "REQUEST"
                ? "환불 요청 등록"
                : "환불 완료"}
          </Button>
        </div>
      </form>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block">
      <span className="mb-1.5 block text-xs text-[#A3A9B5]">{label}</span>
      {children}
    </label>
  );
}
const inputCls =
  "h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 text-sm outline-none focus:border-[#7C5CFF]";
const won = (n: number) => `₩${Math.round(n).toLocaleString("ko-KR")}`;
const nowLocal = () =>
  new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
