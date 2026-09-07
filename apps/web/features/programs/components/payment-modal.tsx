"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  CourseApplicant,
  PaymentMethod,
  PaymentStage,
} from "@aileaders/domain";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordPaymentAction } from "@/features/programs/actions";
import {
  paymentMethodLabels,
  paymentStageLabels,
} from "@/features/programs/constants";

export function PaymentModal({
  open,
  onClose,
  courseId,
  applicant,
  onsite = false,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  applicant: CourseApplicant | null;
  onsite?: boolean;
}) {
  if (!open || !applicant) return null;

  return (
    <PaymentModalContent
      key={`${applicant.enrollment_id}-${onsite ? "onsite" : "standard"}`}
      onClose={onClose}
      courseId={courseId}
      applicant={applicant}
      onsite={onsite}
    />
  );
}

function PaymentModalContent({
  onClose,
  courseId,
  applicant,
  onsite,
}: {
  onClose: () => void;
  courseId: string;
  applicant: CourseApplicant;
  onsite: boolean;
}) {
  const router = useRouter();
  const [payer, setPayer] = useState(() => applicant.customer_name);
  const [stage, setStage] = useState<Exclude<PaymentStage, "REFUND">>(() =>
    onsite ? "BALANCE" : applicant.gross_paid > 0 ? "BALANCE" : "FULL",
  );
  const [method, setMethod] = useState<PaymentMethod>(() =>
    onsite ? "ON_SITE_CARD" : "BANK",
  );
  const [amount, setAmount] = useState(() => applicant.outstanding_amount);
  const [paidAt, setPaidAt] = useState(nowLocal);
  const [dueAt, setDueAt] = useState(() =>
    applicant.payment_due_at ? toLocal(applicant.payment_due_at) : "",
  );
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
            const r = await recordPaymentAction(courseId, {
              enrollment_id: applicant.enrollment_id,
              payer_name: payer,
              payment_stage: stage,
              payment_method: method,
              amount,
              paid_at: paidAt,
              payment_due_at: dueAt,
              reference_no: String(
                new FormData(e.currentTarget).get("reference_no") || "",
              ),
              memo: String(new FormData(e.currentTarget).get("memo") || ""),
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
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-[.18em] text-[#7C5CFF]">
              PAYMENT
            </div>
            <h2 className="mt-2 text-2xl font-semibold">
              {onsite ? "현장 잔금결제" : "결제 등록"}
            </h2>
            <p className="mt-1 text-sm text-[#686F7D]">
              수강생 {applicant.customer_name} · 남은 금액{" "}
              {won(applicant.outstanding_amount)}
            </p>
          </div>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {applicant.gross_paid > 0 ? (
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-[#0D0F13] p-4 text-center">
            <Metric label="수강료" value={won(applicant.final_price)} />
            <Metric label="기결제" value={won(applicant.gross_paid)} />
            <Metric label="잔금" value={won(applicant.outstanding_amount)} />
          </div>
        ) : null}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="실제 입금자">
            <input
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="결제 단계">
            <select
              value={stage}
              onChange={(e) =>
                setStage(e.target.value as Exclude<PaymentStage, "REFUND">)
              }
              className={inputCls}
            >
              {Object.entries(paymentStageLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="결제 수단">
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
          <Field label="결제 금액">
            <input
              type="number"
              min="1"
              max={applicant.outstanding_amount}
              step="1000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="결제일">
            <input
              type="datetime-local"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="결제 예정일 (선택)">
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="승인/입금 참고번호">
          <input
            name="reference_no"
            className={inputCls}
            placeholder="선택 입력"
          />
        </Field>
        <Field label="메모">
          <textarea
            name="memo"
            rows={3}
            className={`${inputCls} h-auto py-3`}
            placeholder={onsite ? "현장 카드 잔금결제" : "예: 친구가 대신 입금"}
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
          <Button disabled={pending || amount <= 0}>
            {pending ? "저장 중..." : "결제 완료"}
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
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-[#686F7D]">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
const inputCls =
  "h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 text-sm outline-none focus:border-[#7C5CFF]";
const won = (n: number) => `₩${Math.round(n).toLocaleString("ko-KR")}`;
const nowLocal = () => {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
};
const toLocal = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
};
