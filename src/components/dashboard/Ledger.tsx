import { formatDayHeading, todayBogota } from '../../lib/dates'
import { formatSigned } from '../../lib/money'
import type { LedgerDay } from '../../lib/calculations/balance'
import { MovementRow } from '../movements/MovementRow'

/** Libro diario: cada día con su saldo al cierre, en una columna numérica alineada. */
export function Ledger({ days, heading }: { days: LedgerDay[]; heading?: string }) {
  const today = todayBogota()
  return (
    <section
      aria-label={heading ?? 'Libro diario'}
      className="flex flex-col gap-1 rounded-2xl bg-surface px-4 py-3 sm:px-5"
    >
      {days.map((day) => (
        <div key={day.date}>
          <div className="flex items-baseline justify-between gap-3 border-b-[3px] border-double border-line-strong pt-3 pb-2">
            <h2
              className={`text-sm font-semibold first-letter:uppercase ${day.date === today ? 'text-primary' : 'text-fg'}`}
            >
              <time dateTime={day.date}>{formatDayHeading(day.date, today)}</time>
            </h2>
            <p className="tabular text-sm text-fg-muted">
              saldo{' '}
              <span className="font-semibold text-fg">{formatSigned(day.closingBalance)}</span>
            </p>
          </div>
          <ul className="divide-y divide-line">
            {day.entries.map((entry) => (
              <MovementRow
                key={entry.movement.id}
                movement={entry.movement}
                effect={entry.effect}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
