export default function CustomersLoading() {
  return <div className="space-y-6"><div className="h-24 max-w-xl animate-pulse rounded-[16px] bg-white/5"/><div className="grid gap-3 sm:grid-cols-3">{[1,2,3].map((item)=><div key={item} className="h-24 animate-pulse rounded-[14px] border border-white/8 bg-[#111318]"/>)}</div><div className="h-[520px] animate-pulse rounded-[16px] border border-white/8 bg-[#111318]"/></div>;
}
