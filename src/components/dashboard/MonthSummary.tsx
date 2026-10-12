import { Link } from 'react-router'
import { memberName, useHousehold } from '../../app/household-context'
import { formatMonthName } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import type { PeriodSummary } from '../../lib/calculations/reports'

interface MonthSummaryProps {
  summary: PeriodSummary
  month: string
}

/** Resumen del mes por persona (spec §17) y contribución (spec §20). */
export function MonthSummary({ summary, month }: MonthSummaryProps) {
  const data = useHousehold()
  const monthName = formatMonthName(month)
  const people = summary.people.filter(
    (person) =>
      data.members.find((member) => member.userId === person.userId)?.active ||
      person.paid + person.incomes + person.transfersSent > 0,
  )
  const maxPaid = Math.max(1, ...people.map((person) => person.paid))

  return (
    <section aria-labelledby="mes" className="rounded-2xl bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="mes" className="text-base font-semibold first-letter:uppercase">
          {monthName}
        </h2>
        <Link to="/reportes" className="text-sm font-medium text-fg-muted hover:text-fg">
          Ver reportes
        </Link>
      </div>
      <p className="mt-3 text-sm text-fg-muted">Gastado entre todos</p>
      <p className="tabular text-3xl font-semibold tracking-tight">
        {formatMoney(summary.totalExpenses)}
      </p>

      <dl className="mt-5 flex flex-col gap-4">
        {people.map((person) => (
          <div key={person.userId} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="font-medium">{memberName(data, person.userId, { you: true })}</dt>
              <dd className="tabular">
                pagó <span className="font-semibold">{formatMoney(person.paid)}</span>
              </dd>
            </div>
            <div
              aria-hidden="true"
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${Math.max(2, (person.paid / maxPaid) * 100)}%` }}
            />
            <dd className="flex flex-wrap justify-between gap-x-3 tabular text-xs text-fg-muted">
              <span>le tocaba {formatMoney(person.share)}</span>
              {person.incomes > 0 && <span>ingresos {formatMoney(person.incomes)}</span>}
              {person.transfersSent > 0 && <span>abonó {formatMoney(person.transfersSent)}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
