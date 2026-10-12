import { ArrowsLeftRightIcon, PlusIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'

// Acciones rápidas (spec §17 / §36): + Gasto / + Ingreso / + Transferencia, siempre a mano.
// Gasto es la acción principal (amarillo); las otras dos, secundarias.

const actions = [
  { to: '/gastos/nuevo', label: 'Gasto', primary: true },
  { to: '/ingresos/nuevo', label: 'Ingreso', primary: false },
  { to: '/transferencias/nueva', label: 'Transferencia', primary: false },
] as const

export function QuickActions({ layout }: { layout: 'row' | 'stack' }) {
  return (
    <nav
      aria-label="Registrar"
      className={
        layout === 'row' ? 'grid grid-cols-[1.15fr_1fr_1.3fr] gap-2' : 'flex flex-col gap-2'
      }
    >
      {actions.map((action) => (
        <Link
          key={action.to}
          to={action.to}
          className={`flex h-12 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-[background-color,transform] duration-150 active:scale-[0.98] ${
            layout === 'row' ? 'justify-center' : 'justify-start px-4'
          } ${
            action.primary
              ? 'bg-primary text-on-primary hover:bg-primary-soft'
              : 'bg-surface-2 text-fg hover:bg-line-strong'
          }`}
        >
          {action.to.startsWith('/transferencias') ? (
            <ArrowsLeftRightIcon aria-hidden="true" className="size-4 shrink-0" weight="bold" />
          ) : (
            <PlusIcon aria-hidden="true" className="size-4 shrink-0" weight="bold" />
          )}
          <span className="truncate">{action.label}</span>
        </Link>
      ))}
    </nav>
  )
}
