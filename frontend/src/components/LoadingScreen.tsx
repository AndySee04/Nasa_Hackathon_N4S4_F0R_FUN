export default function LoadingScreen({ label = 'Loading the museum…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <div className="crayon-spin" aria-hidden="true" />
      <p className="font-display text-dusk">{label}</p>
    </div>
  )
}
