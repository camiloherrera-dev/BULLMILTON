// Pantalla provisional de FASE 0: comprueba que Vite, React, TypeScript y los tokens de
// Tailwind funcionan. Se reemplaza en FASE 2 por el router y las pantallas reales.

const SWATCHES = [
  { name: 'canvas', className: 'bg-canvas' },
  { name: 'surface', className: 'bg-surface' },
  { name: 'surface-2', className: 'bg-surface-2' },
  { name: 'fg', className: 'bg-fg' },
  { name: 'fg-muted', className: 'bg-fg-muted' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'primary-soft', className: 'bg-primary-soft' },
  { name: 'positive', className: 'bg-positive' },
  { name: 'positive-bg', className: 'bg-positive-bg' },
  { name: 'negative', className: 'bg-negative' },
] as const

function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">BULLMILTON</h1>
        <p className="text-sm text-fg-muted">Fase 0 · entorno listo</p>
      </header>

      <section className="rounded-2xl bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-fg-muted">Tokens de color (spec §40.1)</h2>
        <ul className="grid grid-cols-2 gap-2">
          {SWATCHES.map((swatch) => (
            <li key={swatch.name} className="flex items-center gap-2">
              <span
                className={`size-6 shrink-0 rounded-md ring-1 ring-surface-2 ${swatch.className}`}
                aria-hidden="true"
              />
              <code className="text-xs text-fg">{swatch.name}</code>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        className="min-h-12 rounded-xl bg-primary px-4 font-semibold text-on-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        + Gasto
      </button>
    </main>
  )
}

export default App
