/** Placeholders animados enquanto os dados carregam (evita "pulo" de layout). */

export function SkeletonProjeto() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="h-12 w-64 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 h-[400px] md:h-[600px] bg-[#14161a] rounded-[2rem] border border-white/5" />
        <div className="bg-[#14161a] p-8 rounded-[2rem] border border-white/5 space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-white/5 rounded" />
              <div className="h-1.5 w-full bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="h-12 w-64 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-40 bg-[#14161a] rounded-[2rem] border border-white/5" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 text-gray-600">
      <div className="mb-4 opacity-30">{icon}</div>
      <p className="text-xs font-black uppercase tracking-widest text-gray-500">{title}</p>
      {hint && <p className="text-[11px] text-gray-600 mt-2 max-w-xs">{hint}</p>}
    </div>
  );
}
