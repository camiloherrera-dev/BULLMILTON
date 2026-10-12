import { useState } from 'react'
import { Link } from 'react-router'
import { CalendarCheckIcon } from '@phosphor-icons/react'
import { nameInSentence, useHousehold } from '../../app/household-context'
import { useRecurring } from '../../hooks/useRecurring'
import { invalidateData } from '../../hooks/useResource'
import { formatDay, todayBogota } from '../../lib/dates'
import { toUserMessage } from '../../lib/errors'
import { formatMoney } from '../../lib/money'
import { generateRecurring, skipRecurring } from '../../services/recurring'
import type { RecurringExpense } from '../../types/domain'
import { Button } from '../ui/Button'
import { useToast } from '../ui/toast-context'

function PendingItem({ item }: { item: RecurringExpense }) {
  const data = useHousehold()
  const toast = useToast()
  const [busy, setBusy] = useState<'confirm' | 'skip' | null>(null)

  const run = async (action: 'confirm' | 'skip') => {
    setBusy(action)
    try {
      if (action === 'confirm') {
        await generateRecurring(item.id)
        toast.show(`${item.name} registrado`)
      } else {
        await skipRecurring(item.id)
        toast.show(`${item.name}: saltado este periodo`)
      }
      invalidateData()
    } catch (error) {
      toast.show(toUserMessage(error), 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center xl:flex-col xl:items-stretch">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p className="text-sm text-fg-muted">
          Vencía el {formatDay(item.nextDueDate)}, paga {nameInSentence(data, item.paidBy)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto tabular font-semibold sm:mr-2">{formatMoney(item.amount)}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => run('skip')}
          loading={busy === 'skip'}
          disabled={busy !== null}
        >
          Saltar
        </Button>
        <Link
          to={`/recurrentes/${item.id}/confirmar`}
          className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-fg hover:bg-surface-2"
        >
          Ajustar
        </Link>
        <Button
          size="sm"
          onClick={() => run('confirm')}
          loading={busy === 'confirm'}
          disabled={busy !== null}
        >
          Registrar
        </Button>
      </div>
    </li>
  )
}

/** Gastos recurrentes vencidos (spec §15): se muestran al abrir la app y se confirman aquí. */
export function PendingRecurring() {
  const recurring = useRecurring()
  const today = todayBogota()
  const pending = (recurring.data ?? []).filter((item) => item.active && item.nextDueDate <= today)
  if (pending.length === 0) return null

  return (
    <section
      aria-labelledby="pendientes"
      className="rounded-2xl border border-primary/40 bg-primary-wash px-4 py-3"
    >
      <h2 id="pendientes" className="flex items-center gap-2 pt-1 font-semibold">
        <CalendarCheckIcon aria-hidden="true" className="size-5 text-primary" weight="fill" />
        {pending.length === 1
          ? 'Tienes un gasto recurrente pendiente'
          : `Tienes ${pending.length} gastos recurrentes pendientes`}
      </h2>
      <ul className="divide-y divide-line">
        {pending.map((item) => (
          <PendingItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  )
}
