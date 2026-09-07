import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Sparkles, ArrowRight } from "lucide-react";
type PriorityTone = "danger" | "warning";
const priorities: ReadonlyArray<readonly [string, string, PriorityTone]> = [
  ["결제 예정일 경과", "4명", "danger"],
  ["오늘 재연락", "8명", "danger"],
  ["9/12 제주 강의 준비", "78%", "warning"],
  ["강사 미배정 무료강의", "1건", "warning"],
];
export default function Home() {
  const today = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "2-digit",
    weekday: "long",
  })
    .format(new Date())
    .toUpperCase();
  return (
    <div className="mx-auto max-w-[1500px] space-y-8">
      <PageHeader
        eyebrow={today}
        title="Good morning."
        description="AILeaders의 오늘 운영 상태를 한눈에 확인하세요."
      />
      <section className="rounded-[18px] border border-[#7C5CFF]/20 bg-[linear-gradient(120deg,rgba(124,92,255,.12),rgba(17,19,24,.6)_45%)] p-6 md:p-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs tracking-[.15em] text-[#9B87FF]">
              AILEADERS PULSE
            </div>
            <div className="mt-3 text-6xl font-semibold">87</div>
            <div className="mt-2 text-sm text-[#48C78E]">Healthy</div>
          </div>
          <Sparkles className="text-[#9B87FF]" />
        </div>
      </section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="MONTHLY REVENUE" value="₩18.4M" trend="↑ 18.2%" />
        <MetricCard label="CONVERSION" value="28.7%" />
        <MetricCard label="OUTSTANDING" value="₩3.2M" />
        <MetricCard label="CAPACITY FILLED" value="61%" />
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.4fr_.9fr]">
        <div className="rounded-[14px] border border-white/8 bg-[#111318] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today&apos;s Priority</h2>
            <span className="text-xs text-[#686F7D]">Placeholder data</span>
          </div>
          <div className="mt-5 space-y-2">
            {priorities.map(([t, v, tone]) => (
              <div
                key={t}
                className="flex items-center justify-between rounded-[12px] bg-[#0D0F13] px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge tone={tone}>
                    {tone === "danger" ? "ACTION" : "CHECK"}
                  </StatusBadge>
                  <span className="text-sm">{t}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#A3A9B5]">
                  {v}
                  <ArrowRight size={15} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[14px] border border-[#7C5CFF]/20 bg-[#111318] p-6">
          <div className="flex items-center gap-2 text-[#9B87FF]">
            <Sparkles size={17} />
            <span className="text-sm font-semibold">AI Morning Brief</span>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#A3A9B5]">
            어제 신규 리드 12명. 오늘은 결제 예정일을 지난 고객을 먼저 확인하는
            것을 추천합니다.
          </p>
          <div className="mt-5 text-2xl font-semibold">₩1.28M</div>
          <div className="text-xs text-[#686F7D]">Potential recovery</div>
        </div>
      </section>
    </div>
  );
}
