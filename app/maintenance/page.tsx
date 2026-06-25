export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-base-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 select-none">
        <span className="text-5xl font-black tracking-tighter text-primary">SKO</span>
        <span className="text-5xl font-black tracking-tighter text-white">RIO</span>
      </div>

      <div className="w-16 h-16 mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <span className="text-3xl">🔧</span>
      </div>

      <h1 className="text-2xl font-black text-white mb-3 tracking-tight">
        Under Maintenance
      </h1>
      <p className="text-sm text-white/40 max-w-xs leading-relaxed">
        We&apos;re making some improvements. We&apos;ll be back shortly — check back in a few minutes.
      </p>

      <div className="mt-10 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
