import { lazy, Suspense } from 'react'
import { Link, useRouteError } from 'react-router'
import { LedgerSkeleton } from '../components/ui/States'
import { buttonClasses } from '../components/ui/buttonClasses'
import { AppShell } from './AppShell'
import { HouseholdProvider } from './HouseholdProvider'

export function RouteError() {
  const error = useRouteError()
  if (import.meta.env.DEV) console.error('[BULLMILTON]', error)
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-4">
      <p className="text-lg font-bold tracking-tight">BULLMILTON</p>
      <h1 className="text-2xl font-semibold">Algo salió mal</h1>
      <p className="text-fg-muted">Recarga la página. Si sigue pasando, vuelve al inicio.</p>
      <Link to="/" className={buttonClasses('primary', 'md', 'self-start')}>
        Volver al inicio
      </Link>
    </main>
  )
}

export function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-4">
      <p className="text-lg font-bold tracking-tight">BULLMILTON</p>
      <h1 className="text-2xl font-semibold">Esta página no existe</h1>
      <Link to="/" className={buttonClasses('primary', 'md', 'self-start')}>
        Ir al inicio
      </Link>
    </main>
  )
}

export function HouseholdLayout() {
  return (
    <HouseholdProvider>
      <AppShell />
    </HouseholdProvider>
  )
}

// Reportes incluye la librería de gráficos: se carga solo al abrirlo.
const ReportsPage = lazy(() =>
  import('../pages/Reports/ReportsPage').then((module) => ({ default: module.ReportsPage })),
)

export function ReportsRoute() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-10">
          <LedgerSkeleton days={2} />
        </div>
      }
    >
      <ReportsPage />
    </Suspense>
  )
}
