import { Link } from 'react-router'
import { memberName, useHousehold } from '../../app/household-context'
import { formatMonthName } from '../../lib/dates'
import { formatMoney, formatSigned } from '../../lib/money'
import type { PeriodBridge } from '../../lib/calculations/ledger'
import type { PeriodSummary } from '../../lib/calculations/reports'
import { balancePhrase } from '../movements/describe'

interface MonthSummaryProps {
  summary: PeriodSummary
  /** Cómo pasa tu saldo del cierre del mes anterior a hoy (lib/calculations/ledger). */
  bridge: PeriodBridge
  month: string
}

/**
 * Resumen del mes por persona (spec §17) y contribución (spec §20). Es solo el mes: el puente
 * del final conecta con el saldo total para que no se confundan.
 */
export function MonthSummary({ summary, bridge, month }: MonthSummaryProps) {
  const data = useHousehold()
  const monthName = formatMonthName(month)
  const others = data.members.filter((member) => member.userId !== data.userId)
  const other = others.length === 1 ? others[0].displayName : null

  let covered: string
  if (bridge.expenses > 0) covered = `Tú cubriste ${formatMoney(bridge.expenses)} más de tu parte`
  else if (bridge.expenses < 0 && other)
    covered = `${other} cubrió ${formatMoney(-bridge.expenses)} más de su parte`
  else if (bridge.expenses < 0)
    covered = `Cubriste ${formatMoney(-bridge.expenses)} menos de tu parte`
  else covered = 'Cada uno cubrió justo su parte'

  const start = balancePhrase(bridge.before, data, 'past')
  const end = balancePhrase(bridge.after, data)
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
      <p className="mt-1 text-sm text-fg-muted">Solo este mes; tu saldo total está arriba.</p>
      <p className="mt-4 text-sm text-fg-muted">
        Gastado entre {people.length === 2 ? 'los dos' : 'todos'}
      </p>
      <p className="tabular text-3xl font-semibold tracking-tight">
        {formatMoney(summary.totalExpenses)}
      </p>

      <dl className="mt-5 flex flex-col gap-4">
        {people.map((person) => (
          <div key={person.userId} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="font-medium">{memberName(data, person.userId, { you: true })}</dt>
              <dd className="tabular">
                {person.userId === data.userId ? 'pagaste' : 'pagó'}{' '}
                <span className="font-semibold">{formatMoney(person.paid)}</span>
              </dd>
            </div>
            <div
              aria-hidden="true"
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${Math.max(2, (person.paid / maxPaid) * 100)}%` }}
            />
            <dd className="flex flex-wrap justify-between gap-x-3 tabular text-xs text-fg-muted">
              <span>
                {person.userId === data.userId ? 'te tocaba' : 'le tocaba'}{' '}
                {formatMoney(person.share)}
              </span>
              {person.incomes > 0 && <span>ingresos {formatMoney(person.incomes)}</span>}
              {person.transfersSent > 0 && (
                <span>
                  {person.userId === data.userId ? 'abonaste' : 'abonó'}{' '}
                  {formatMoney(person.transfersSent)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 border-t border-line pt-4">
        <p className="font-semibold">Este mes: {lowerFirstIfYou(covered)}</p>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-fg-muted">Al empezar el mes</dt>
            <dd className="text-right">
              {start.lead}
              {start.amount !== null && (
                <span className="tabular font-semibold"> {formatMoney(start.amount)}</span>
              )}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-fg-muted">Gastos del mes</dt>
            <dd className="tabular font-semibold">{formatSigned(bridge.expenses)}</dd>
          </div>
          {bridge.transfers !== 0 && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-fg-muted">Abonos del mes</dt>
              <dd className="tabular font-semibold">{formatSigned(bridge.transfers)}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-3 border-t-[3px] border-double border-line-strong pt-2">
            <dt className="font-medium">Ahora</dt>
            <dd className="text-right font-medium">
              {end.lead}
              {end.amount !== null && (
                <span className="tabular font-semibold"> {formatMoney(end.amount)}</span>
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-fg-muted">+ suma a tu favor · − resta</p>
      </div>
    </section>
  )
}

/** "Tú cubriste…" → "tú cubriste…" tras "Este mes:"; los nombres propios se quedan igual. */
function lowerFirstIfYou(text: string) {
  return /^(Tú|Cubriste|Cada)/.test(text) ? text[0].toLowerCase() + text.slice(1) : text
}
