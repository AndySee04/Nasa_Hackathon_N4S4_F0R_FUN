export default function LoadingScreen({ label = 'Loading the museum…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-white/10 border-t-cyan" />
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-cyan to-violet opacity-80" />
      </div>
      <p className="font-display text-muted">{label}</p>
    </div>
  )
}
