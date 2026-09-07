import Link from "next/link";
import { Database, Settings2, ShieldCheck, Users } from "lucide-react";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canManageImports, isSuperAdmin } from "@/lib/permissions";

export default async function SettingsPage() {
  const profile = await requireActiveProfile();
  const cards = [
    isSuperAdmin(profile) ? { href: "/settings/users", title: "Users & Permissions", description: "회원 승인, 직무와 권한을 관리합니다.", icon: Users } : null,
    canManageImports(profile) ? { href: "/settings/import", title: "Data Import", description: "기존 Excel을 검수 후 AILeaders CRM으로 이전합니다.", icon: Database } : null,
  ].filter(Boolean) as Array<{ href: string; title: string; description: string; icon: typeof Users }>;

  return <div className="space-y-6">
    <div><div className="text-[11px] font-semibold tracking-[.18em] text-[#7C5CFF]">SYSTEM</div><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Settings</h1><p className="mt-2 text-sm text-[#686F7D]">AILeaders OS의 계정, 권한, 데이터 이전과 운영 설정을 관리합니다.</p></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ href, title, description, icon: Icon }) => <Link href={href} key={href} className="rounded-[16px] border border-white/8 bg-[#111318] p-5 transition hover:border-white/14 hover:bg-[#15181E]"><div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-white/5 text-[#9B87FF]"><Icon size={19}/></div><div className="mt-5 font-semibold">{title}</div><div className="mt-2 text-sm leading-6 text-[#686F7D]">{description}</div></Link>)}
      <div className="rounded-[16px] border border-white/8 bg-[#0D0F13] p-5 opacity-70"><div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-white/5 text-[#686F7D]"><Settings2 size={19}/></div><div className="mt-5 font-semibold">Integrations</div><div className="mt-2 text-sm leading-6 text-[#686F7D]">뿌리오, 홈페이지 신청폼, AI 설정은 후속 Sprint에서 연결합니다.</div></div>
      <div className="rounded-[16px] border border-white/8 bg-[#0D0F13] p-5 opacity-70"><div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-white/5 text-[#686F7D]"><ShieldCheck size={19}/></div><div className="mt-5 font-semibold">Security</div><div className="mt-2 text-sm leading-6 text-[#686F7D]">RLS, Audit Log, MFA와 보안 정책을 확장합니다.</div></div>
    </div>
  </div>;
}
