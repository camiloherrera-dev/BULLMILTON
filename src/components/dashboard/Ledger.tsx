import { useHousehold } from '../../app/household-context'
import { formatDayHeading, todayBogota } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import type { AnnotatedDay } from '../../lib/calculations/ledger'
import { balancePhrase } from '../movements/describe'
import { MovementRow } from '../movements/MovementRow'

/** Libro diario: cada día con cómo quedó el saldo al cierre, en palabras. */
export function Ledger({ days, heading }: { days: AnnotatedDay[]; heading?: string }) {
  const data = useHousehold()
  const today = todayBogota()
  return (
    <section
      aria-label={heading ?? 'Libro diario'}
      className="flex flex-col gap-1 rounded-2xl bg-surface px-4 py-3 sm:px-5"
    >
      {days.map((day) => {
        const isToday = day.date === today
        const closing = balancePhrase(day.closingBalance, data, isToday ? 'now' : 'past')
        return (
          <div key={day.date}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b-[3px] border-double border-line-strong pt-3 pb-2">
              <h2
                className={`text-sm font-semibold first-letter:uppercase ${isToday ? 'text-primary' : 'text-fg'}`}
              >
                <time dateTime={day.date}>{formatDayHeading(day.date, today)}</time>
              </h2>
              <p className="text-sm text-fg-muted">
                <span className="sr-only">{isToday ? 'Por ahora: ' : 'Al cierre del día: '}</span>
                {closing.lead}
                {closing.amount !== null && (
                  <>
                    {' '}
                    <span className="tabular font-semibold text-fg">
                      {formatMoney(closing.amount)}
                    </span>
                  </>
                )}
              </p>
            </div>
            <ul className="divide-y divide-line">
              {day.entries.map((entry) => (
                <MovementRow key={entry.movement.id} entry={entry} />
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
