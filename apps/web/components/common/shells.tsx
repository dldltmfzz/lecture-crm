export function ModalShell({children}:{children:React.ReactNode}){return <div className="max-w-[560px] rounded-[20px] border border-white/10 bg-[#171A20] p-6 shadow-2xl">{children}</div>}
export function DrawerShell({children}:{children:React.ReactNode}){return <aside className="w-full md:w-[480px] min-h-screen border-l border-white/8 bg-[#111318] p-6">{children}</aside>}
export function DataTableShell({children}:{children:React.ReactNode}){return <div className="overflow-hidden rounded-[14px] border border-white/8 bg-[#111318]">{children}</div>}
export function ConfirmDialog({title,description}:{title:string;description:string}){return <ModalShell><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 text-sm text-[#A3A9B5]">{description}</p></ModalShell>}
