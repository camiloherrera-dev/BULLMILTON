import { Link } from 'react-router'
import { useHousehold } from '../../app/household-context'
import { formatMoney, formatSigned } from '../../lib/money'
import type { Movement } from '../../types/domain'
import { CategoryIcon, TransferIcon } from './CategoryIcon'
import { movementDetail, movementPath, movementTitle } from './describe'

interface MovementRowProps {
  movement: Movement
  /** Efecto en el saldo de quien mira (del motor de balance). */
  effect: number
  /** Muestra la fecha en la línea secundaria (historial sin agrupar por día). */
  showDate?: string
}

const kindLabel = { expense: 'Gasto', income: 'Ingreso', transfer: 'Transferencia' } as const

/** Fila del libro: icono y tipo, descripción, quién/división y efecto en tu saldo. */
export function MovementRow({ movement, effect, showDate }: MovementRowProps) {
  const data = useHousehold()
  const category =
    movement.kind === 'transfer'
      ? null
      : data.categories.find((entry) => entry.id === movement.categoryId)
  const voided = movement.status === 'voided'

  const effectTone = effect > 0 ? 'text-positive' : effect < 0 ? 'text-negative' : 'text-fg-muted'
  const effectHint = effect > 0 ? 'a tu favor' : effect < 0 ? 'en tu contra' : 'no cambia el saldo'

  return (
    <li>
      <Link
        to={movementPath(movement)}
        className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-150 hover:bg-surface-2/70"
      >
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full ${
            movement.kind === 'income'
              ? 'bg-positive-bg text-positive'
              : movement.kind === 'transfer'
                ? 'bg-primary-wash text-primary'
                : 'bg-surface-2 text-fg'
          }`}
        >
          {movement.kind === 'transfer' ? <TransferIcon /> : <CategoryIcon icon={category?.icon} />}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={`truncate font-medium ${voided ? 'text-fg-muted line-through' : 'text-fg'}`}
          >
            {movementTitle(movement)}
          </span>
          <span className="truncate text-sm text-fg-muted">
            <span className="sr-only">{kindLabel[movement.kind]}. </span>
            {voided ? 'Anulado: ' : ''}
            {showDate ? `${showDate}, ` : ''}
            {movementDetail(movement, data)}
            {category && movement.kind === 'income' ? `, ${category.name}` : ''}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end tabular">
          {movement.kind === 'income' || voided ? (
            <span className="font-semibold text-fg-muted">{formatMoney(movement.amount)}</span>
          ) : (
            <span className={`font-semibold ${effectTone}`}>{formatSigned(effect)}</span>
          )}
          <span className="text-xs text-fg-muted">
            {movement.kind === 'expense' && !voided
              ? `de ${formatMoney(movement.amount)}`
              : voided
                ? 'sin efecto'
                : movement.kind === 'income'
                  ? 'ingreso'
                  : effectHint}
          </span>
          <span className="sr-only">{effectHint}</span>
        </span>
      </Link>
    </li>
  )
}
