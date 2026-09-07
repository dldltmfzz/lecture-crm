"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ImportBatch, ImportRow } from "@aileaders/domain";
import {
  CheckCheck,
  Database,
  FileSpreadsheet,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  approveReadyRowsAction,
  commitImportBatchAction,
  runAiClassificationAction,
  uploadImportWorkbookAction,
} from "@/features/imports/actions";
import { ImportReviewDrawer } from "@/features/imports/components/import-review-drawer";
import {
  effectiveClassification,
  effectiveNormalized,
} from "@/features/imports/view-utils";

export function ImportWorkspace({
  batches,
  batch,
  rows,
}: {
  batches: ImportBatch[];
  batch: ImportBatch | null;
  rows: ImportRow[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ImportRow | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (
        statusFilter !== "ALL" &&
        row.status !== statusFilter &&
        row.review_status !== statusFilter &&
        row.match_type !== statusFilter
      )
        return false;
      if (!q) return true;
      const n = effectiveNormalized(row);
      return [
        row.sheet_name,
        n.name,
        n.phone,
        n.region,
        n.legacy_note,
        row.classification_data.summary,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [query, rows, statusFilter]);

  const doAi = () =>
    batch &&
    startTransition(async () => {
      setMessage(null);
      const result = await runAiClassificationAction(batch.id);
      setMessage(
        result.ok
          ? `AI 분류 ${result.data.classified.toLocaleString("ko-KR")}건을 반영했습니다.`
          : result.error,
      );
      router.refresh();
    });

  const approveReady = () =>
    batch &&
    startTransition(async () => {
      setMessage(null);
      const result = await approveReadyRowsAction(batch.id);
      setMessage(
        result.ok
          ? `검수 불필요 행 ${result.data.approved.toLocaleString("ko-KR")}건을 승인했습니다.`
          : result.error,
      );
      router.refresh();
    });

  const commit = () =>
    batch &&
    startTransition(async () => {
      if (
        !window.confirm(
          `승인된 ${batch.approved_rows.toLocaleString("ko-KR")}건을 실제 Customers + Leads + Consultations로 Import할까요?\n\nImport 전 원본 Excel은 private Storage에 보존됩니다.`,
        )
      )
        return;
      setMessage(null);
      const result = await commitImportBatchAction(batch.id);
      setMessage(
        result.ok
          ? `Import 완료: ${result.data.imported}건 · 실패 ${result.data.failed}건`
          : result.error,
      );
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-[11px] font-semibold tracking-[.18em] text-[#7C5CFF]">
            SETTINGS / DATA MIGRATION
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Excel Import
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#686F7D]">
            원본 파일은 보존하고, 중복 고객과 Legacy 메모를 검수한 뒤 승인된
            행만 CRM에 반영합니다.
          </p>
        </div>
        <Link
          href="/settings"
          className="text-sm text-[#A3A9B5] hover:text-white"
        >
          ← Settings
        </Link>
      </header>

      <UploadCard />

      {message ? (
        <div className="rounded-[12px] border border-[#7C5CFF]/25 bg-[#7C5CFF]/8 px-4 py-3 text-sm text-[#C9BFFF]">
          {message}
        </div>
      ) : null}

      {batch ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <MiniKpi
              label="전체 행"
              value={batch.total_rows}
              icon={<FileSpreadsheet size={15} />}
            />
            <MiniKpi
              label="바로 승인 가능"
              value={batch.ready_rows}
              icon={<CheckCheck size={15} />}
              tone="success"
            />
            <MiniKpi
              label="검수 필요"
              value={batch.needs_review_rows}
              icon={<ShieldCheck size={15} />}
              tone="warning"
            />
            <MiniKpi
              label="오류"
              value={batch.error_rows}
              icon={<XCircle size={15} />}
              tone="danger"
            />
            <MiniKpi
              label="승인"
              value={batch.approved_rows}
              icon={<Users size={15} />}
            />
            <MiniKpi
              label="Import 완료"
              value={batch.imported_rows}
              icon={<Database size={15} />}
              tone="success"
            />
          </section>

          <section className="rounded-[16px] border border-white/8 bg-[#111318] p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={batchTone(batch.status)}>
                    {batchStatusLabel(batch.status)}
                  </StatusBadge>
                  <span className="text-sm font-semibold">
                    {batch.file_name}
                  </span>
                  <span className="text-xs text-[#686F7D]">
                    {batch.sheet_count} sheets · {formatDate(batch.created_at)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-[#686F7D]">
                  AI 보강 분류 {batch.ai_classified_rows}건 · 제외{" "}
                  {batch.skipped_rows}건
                  {batch.error_message ? ` · ${batch.error_message}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ai"
                  disabled={pending || batch.status === "COMPLETED"}
                  onClick={doAi}
                >
                  <Sparkles size={16} className="mr-2" />
                  AI 분류 보강
                </Button>
                <Button
                  variant="secondary"
                  disabled={pending || batch.status === "COMPLETED"}
                  onClick={approveReady}
                >
                  <CheckCheck size={16} className="mr-2" />
                  Ready 일괄 승인
                </Button>
                <Button
                  disabled={
                    pending ||
                    batch.approved_rows === 0 ||
                    batch.status === "COMPLETED"
                  }
                  onClick={commit}
                >
                  <Database size={16} className="mr-2" />
                  최종 Import
                </Button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[16px] border border-white/8 bg-[#111318]">
            <div className="border-b border-white/8 p-4 md:p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex gap-1 overflow-x-auto">
                  {[
                    ["ALL", "전체"],
                    ["NEEDS_REVIEW", "검수 필요"],
                    ["ERROR", "오류"],
                    ["EXISTING", "기존 고객"],
                    ["SAME_BATCH", "동일 고객"],
                    ["APPROVED", "승인"],
                    ["IMPORTED", "완료"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`whitespace-nowrap rounded-[9px] px-3 py-2 text-xs font-medium ${statusFilter === key ? "bg-white text-[#08090C]" : "text-[#A3A9B5] hover:bg-white/5"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="relative w-full xl:w-[320px]">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686F7D]"
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="이름, 전화, 시트, 메모 검색"
                    className="h-10 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] pl-9 pr-3 text-sm outline-none placeholder:text-[#484E59] focus:border-[#7C5CFF]"
                  />
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-[.75fr_1.05fr_1fr_.8fr_1.25fr_.8fr] gap-4 border-b border-white/8 px-5 py-3 text-[10px] font-semibold uppercase tracking-[.1em] text-[#686F7D]">
                <div>원본</div>
                <div>고객</div>
                <div>중복</div>
                <div>상태</div>
                <div>AI / 규칙 해석</div>
                <div>검수</div>
              </div>
              {filtered.map((row) => (
                <ImportRowLine
                  key={row.id}
                  row={row}
                  onOpen={() => setSelected(row)}
                />
              ))}
            </div>

            <div className="divide-y divide-white/[.06] lg:hidden">
              {filtered.map((row) => (
                <button
                  key={row.id}
                  onClick={() => setSelected(row)}
                  className="w-full p-4 text-left hover:bg-white/[.025]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {effectiveNormalized(row).name || "이름 없음"}
                      </div>
                      <div className="mt-1 text-xs text-[#686F7D]">
                        {row.sheet_name} · {row.sheet_row}행
                      </div>
                    </div>
                    <RowStatus row={row} />
                  </div>
                  <div className="mt-3 text-sm text-[#A3A9B5]">
                    {row.classification_data.summary}
                  </div>
                </button>
              ))}
            </div>
            {!filtered.length ? (
              <div className="p-14 text-center text-sm text-[#686F7D]">
                조건에 맞는 Import 행이 없습니다.
              </div>
            ) : null}
          </section>
        </>
      ) : (
        <EmptyBatchState />
      )}

      <BatchHistory batches={batches} activeId={batch?.id ?? null} />
      <ImportReviewDrawer
        row={selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          setSelected(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function UploadCard() {
  return (
    <form
      action={uploadImportWorkbookAction}
      className="rounded-[16px] border border-dashed border-white/12 bg-[#0D0F13] p-5 md:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-[12px] bg-[#7C5CFF]/10 p-3 text-[#9B87FF]">
            <Upload size={20} />
          </div>
          <div>
            <div className="font-semibold">Legacy Excel 업로드</div>
            <div className="mt-1 text-xs leading-5 text-[#686F7D]">
              .xlsx · 최대 10MB · 업로드 즉시 CRM에 반영되지 않습니다. 먼저
              Preview/검수를 생성합니다.
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            required
            name="file"
            type="file"
            accept=".xlsx"
            className="max-w-[280px] rounded-[10px] border border-white/10 bg-[#111318] px-3 py-2 text-xs text-[#A3A9B5] file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-black"
          />
          <Button type="submit">
            <Upload size={16} className="mr-2" />
            분석 시작
          </Button>
        </div>
      </div>
    </form>
  );
}

function ImportRowLine({
  row,
  onOpen,
}: {
  row: ImportRow;
  onOpen: () => void;
}) {
  const normalized = effectiveNormalized(row);
  const classification = effectiveClassification(row);
  return (
    <button
      onClick={onOpen}
      className="grid w-full grid-cols-[.75fr_1.05fr_1fr_.8fr_1.25fr_.8fr] gap-4 border-b border-white/[.055] px-5 py-4 text-left transition last:border-b-0 hover:bg-white/[.025]"
    >
      <div>
        <div className="text-xs font-medium text-[#D9DCE2]">
          {row.sheet_name}
        </div>
        <div className="mt-1 text-[11px] text-[#686F7D]">
          {row.sheet_row}행 ·{" "}
          {row.sheet_kind === "CONFIRMED" ? "확정명단" : "상담명단"}
        </div>
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">
          {normalized.name || "이름 없음"}
        </div>
        <div className="mt-1 truncate text-xs text-[#686F7D]">
          {normalized.phone || "연락처 없음"} ·{" "}
          {normalized.region || "지역 미입력"}
        </div>
      </div>
      <div>
        <MatchBadge type={row.match_type} />
        {row.match_context.matched_name ? (
          <div className="mt-1 text-[10px] text-[#686F7D]">
            비교 이름 · {row.match_context.matched_name}
          </div>
        ) : row.matched_customer_id ? (
          <div className="mt-1 text-[10px] text-[#686F7D]">
            기존 Customer 연결
          </div>
        ) : null}
      </div>
      <div>
        <RowStatus row={row} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs text-[#D9DCE2]">
          {classification.summary}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          <StatusBadge tone={leadTone(classification.lead_status)}>
            {leadLabel(classification.lead_status)}
          </StatusBadge>
          {classification.follow_up_required ? (
            <StatusBadge tone="warning">재연락</StatusBadge>
          ) : null}
          <span className="self-center text-[10px] text-[#686F7D]">
            {row.classification_engine} ·{" "}
            {Math.round(classification.confidence * 100)}%
          </span>
        </div>
      </div>
      <div>
        {row.review_status === "APPROVED" ? (
          <StatusBadge tone="success">승인</StatusBadge>
        ) : row.review_status === "SKIPPED" ? (
          <StatusBadge>제외</StatusBadge>
        ) : (
          <span className="text-xs text-[#A3A9B5]">검수하기 →</span>
        )}
      </div>
    </button>
  );
}

function BatchHistory({
  batches,
  activeId,
}: {
  batches: ImportBatch[];
  activeId: string | null;
}) {
  if (!batches.length) return null;
  return (
    <section className="rounded-[16px] border border-white/8 bg-[#111318] p-5">
      <div className="text-sm font-semibold">최근 Import</div>
      <div className="mt-4 grid gap-2">
        {batches.slice(0, 8).map((item) => (
          <Link
            key={item.id}
            href={`/settings/import?batch=${item.id}`}
            className={`flex flex-col gap-2 rounded-[12px] border p-3 transition sm:flex-row sm:items-center sm:justify-between ${activeId === item.id ? "border-[#7C5CFF]/30 bg-[#7C5CFF]/7" : "border-white/7 hover:bg-white/[.025]"}`}
          >
            <div>
              <div className="text-sm font-medium">{item.file_name}</div>
              <div className="mt-1 text-xs text-[#686F7D]">
                {formatDate(item.created_at)} · {item.total_rows} rows
              </div>
            </div>
            <StatusBadge tone={batchTone(item.status)}>
              {batchStatusLabel(item.status)}
            </StatusBadge>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EmptyBatchState() {
  return (
    <section className="rounded-[16px] border border-white/8 bg-[#111318] p-14 text-center">
      <FileSpreadsheet size={28} className="mx-auto text-[#484E59]" />
      <div className="mt-4 font-semibold">
        Excel을 업로드하면 검수 Preview가 생성됩니다.
      </div>
      <div className="mt-2 text-sm text-[#686F7D]">
        Customers / Leads / Consultations에는 최종 승인 전까지 아무 데이터도
        추가되지 않습니다.
      </div>
    </section>
  );
}

function MiniKpi({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones = {
    default: "text-[#686F7D]",
    success: "text-[#48C78E]",
    warning: "text-[#FFB84D]",
    danger: "text-[#FF5C5C]",
  };
  return (
    <div className="rounded-[14px] border border-white/8 bg-[#111318] p-4">
      <div className={`flex items-center gap-2 text-xs ${tones[tone]}`}>
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">
        {value.toLocaleString("ko-KR")}
      </div>
    </div>
  );
}

function RowStatus({ row }: { row: ImportRow }) {
  if (row.status === "ERROR")
    return <StatusBadge tone="danger">오류</StatusBadge>;
  if (row.status === "NEEDS_REVIEW")
    return <StatusBadge tone="warning">검수 필요</StatusBadge>;
  if (row.status === "IMPORTED")
    return <StatusBadge tone="success">Import 완료</StatusBadge>;
  if (row.status === "SKIPPED") return <StatusBadge>제외</StatusBadge>;
  return <StatusBadge tone="info">Ready</StatusBadge>;
}

function MatchBadge({ type }: { type: ImportRow["match_type"] }) {
  if (type === "EXISTING")
    return <StatusBadge tone="info">기존 고객</StatusBadge>;
  if (type === "SAME_BATCH")
    return <StatusBadge tone="warning">같은 파일 동일고객</StatusBadge>;
  if (type === "INVALID_PHONE")
    return <StatusBadge tone="danger">전화 오류</StatusBadge>;
  return <StatusBadge tone="success">신규</StatusBadge>;
}

function batchStatusLabel(status: ImportBatch["status"]) {
  return (
    {
      UPLOADED: "업로드",
      PARSED: "파싱",
      CLASSIFYING: "AI 분류중",
      REVIEW: "검수",
      IMPORTING: "Import중",
      COMPLETED: "완료",
      FAILED: "실패",
    } as const
  )[status];
}
function batchTone(
  status: ImportBatch["status"],
): "neutral" | "info" | "warning" | "success" | "danger" {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "danger";
  if (status === "CLASSIFYING" || status === "IMPORTING") return "warning";
  if (status === "REVIEW") return "info";
  return "neutral";
}
function leadLabel(status: string) {
  return (
    (
      {
        NEW: "신규",
        CONTACTING: "연락중",
        CONSULTED: "상담완료",
        PAYMENT_PENDING: "결제대기",
        PAID: "결제완료",
        COMPLETED: "수강완료",
        CANCELLED: "취소",
        REFUNDED: "환불",
        LOST: "종료",
      } as Record<string, string>
    )[status] ?? status
  );
}
function leadTone(
  status: string,
): "neutral" | "info" | "warning" | "success" | "danger" {
  if (["PAID", "COMPLETED"].includes(status)) return "success";
  if (status === "PAYMENT_PENDING") return "warning";
  if (["CANCELLED", "REFUNDED", "LOST"].includes(status)) return "danger";
  if (["NEW", "CONTACTING"].includes(status)) return "info";
  return "neutral";
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
