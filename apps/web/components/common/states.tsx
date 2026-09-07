export function LoadingState(){return <div className="p-8 text-sm text-[#A3A9B5]">Loading…</div>}
export function EmptyState({title="아직 데이터가 없습니다."}:{title?:string}){return <div className="rounded-[14px] border border-white/8 bg-[#111318] p-10 text-center text-[#A3A9B5]">{title}</div>}
export function ErrorState({title="문제가 발생했습니다."}:{title?:string}){return <div className="rounded-[14px] border border-[#FF5C5C]/20 bg-[#FF5C5C]/5 p-6 text-[#FF8A8A]">{title}</div>}
