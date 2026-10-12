import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMonthName, formatMonthShort } from '../../lib/dates'
import { formatAmount, formatMoney } from '../../lib/money'
import type { PersonColorId } from '../../lib/appearance'
import type { MonthTotal } from '../../lib/calculations/reports'
import { personBg } from '../people/personClasses'

interface MonthlyChartProps {
  months: MonthTotal[]
  names: Record<string, string>
  /** Color de cada persona: cada columna se apila por quién pagó. */
  colors: Record<string, PersonColorId>
}

function compact(value: number): string {
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`
  if (value >= 1_000) return `${Math.round(value / 1_000)} mil`
  return formatAmount(value)
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: MonthTotal }>
  names: Record<string, string>
}

function ChartTooltip({ active, payload, names }: TooltipProps) {
  if (!active || !payload?.length) return null
  const month = payload[0].payload
  return (
    <div className="rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm shadow-[0_8px_24px_-8px_var(--shadow-tint)]">
      <p className="font-semibold first-letter:uppercase">{formatMonthName(month.month)}</p>
      <p className="tabular">{formatMoney(month.total)}</p>
      <p className="mt-1.5 text-xs text-fg-muted">Lo pagó:</p>
      <dl className="flex flex-col gap-0.5 text-fg-muted">
        {Object.entries(month.byPerson).map(([userId, amount]) => (
          <div key={userId} className="flex justify-between gap-4 tabular">
            <dt>{names[userId] ?? 'Alguien'}</dt>
            <dd>{formatMoney(amount)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * Evolución mensual del gasto (spec §19): columnas apiladas por quién pagó, cada persona en su
 * color, con leyenda (los nombres, no solo el color), tooltip y vista de tabla.
 */
export function MonthlyChart({ months, names, colors }: MonthlyChartProps) {
  const [asTable, setAsTable] = useState(false)
  const max = Math.max(...months.map((month) => month.total))
  const people = Object.keys(names)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul
          aria-label="Quién pagó"
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted"
        >
          <li aria-hidden="true">Pagó:</li>
          {people.map((userId) => (
            <li key={userId} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={`size-2.5 rounded-sm ${personBg[colors[userId] ?? 'azul']}`}
              />
              {names[userId]}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setAsTable((value) => !value)}
          className="text-sm font-medium text-fg-muted underline hover:text-fg"
        >
          {asTable ? 'Ver gráfico' : 'Ver como tabla'}
        </button>
      </div>
      {asTable || max === 0 ? (
        <table className="w-full text-sm">
          <caption className="sr-only">Gasto por mes</caption>
          <thead>
            <tr className="border-b border-line text-left text-fg-muted">
              <th scope="col" className="py-2 font-medium">
                Mes
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Total
              </th>
              {Object.keys(names).map((userId) => (
                <th
                  key={userId}
                  scope="col"
                  className="hidden py-2 text-right font-medium sm:table-cell"
                >
                  Pagó {names[userId]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((month) => (
              <tr key={month.month} className="border-b border-line last:border-0">
                <th scope="row" className="py-2 text-left font-medium first-letter:uppercase">
                  {formatMonthName(month.month)} {month.month.slice(0, 4)}
                </th>
                <td className="py-2 text-right tabular">{formatMoney(month.total)}</td>
                {Object.keys(names).map((userId) => (
                  <td
                    key={userId}
                    className="hidden py-2 text-right tabular text-fg-muted sm:table-cell"
                  >
                    {formatMoney(month.byPerson[userId] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div
          className="h-56 w-full"
          role="img"
          aria-label={`Gasto por mes: ${months.map((month) => `${formatMonthName(month.month)} ${formatMoney(month.total)}`).join(', ')}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={months}
              margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
              barCategoryGap="28%"
            >
              <CartesianGrid vertical={false} stroke="var(--color-line)" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonthShort}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--color-fg-muted)', fontSize: 12 }}
                interval={0}
              />
              <YAxis
                tickFormatter={compact}
                tickLine={false}
                axisLine={false}
                width={52}
                tick={{ fill: 'var(--color-fg-muted)', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: 'var(--color-line)' }}
                content={<ChartTooltip names={names} />}
                isAnimationActive={false}
              />
              {people.map((userId, index) => (
                <Bar
                  key={userId}
                  stackId="pagado"
                  name={names[userId]}
                  dataKey={(month: MonthTotal) => month.byPerson[userId] ?? 0}
                  fill={`var(--color-person-${colors[userId] ?? 'azul'})`}
                  // Separación de 2 px entre tramos, del color del panel.
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                  radius={index === people.length - 1 ? [4, 4, 0, 0] : 0}
                  maxBarSize={36}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
