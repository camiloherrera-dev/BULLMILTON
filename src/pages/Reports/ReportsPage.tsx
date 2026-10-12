import { useMemo, useState } from 'react'
import { ChartPieIcon } from '@phosphor-icons/react'
import { memberName, useHousehold } from '../../app/household-context'
import {
  expensesByCategory,
  monthlyExpenses,
  summarizePeriod,
} from '../../lib/calculations/reports'
import { addMonths, startOfMonth, todayBogota } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import { periodLabels, resolvePeriod, type PeriodPreset } from '../../lib/periods'
import { MonthlyChart } from '../../components/charts/MonthlyChart'
import { CategoryIcon } from '../../components/movements/CategoryIcon'
import { Field, TextInput } from '../../components/ui/Field'
import { Page, PageHeader } from '../../components/ui/PageHeader'
import { Segmented } from '../../components/ui/Segmented'
import { EmptyState } from '../../components/ui/States'

const presets: PeriodPreset[] = ['week', 'month', 'previousMonth', 'last3Months', 'custom']

function Panel({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-4 rounded-2xl bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Reportes (spec §19-§20): totales, ingresos, categorías, contribución y evolución mensual. */
export function ReportsPage() {
  const data = useHousehold()
  const today = todayBogota()
  const [preset, setPreset] = useState<PeriodPreset>('month')
  const [custom, setCustom] = useState({ from: startOfMonth(today), to: today })
  const [scope, setScope] = useState<'household' | 'mine'>('household')

  const range = resolvePeriod(preset, today, custom)
  const memberIds = data.members.map((member) => member.userId)

  const { summary, categories, months } = useMemo(() => {
    // La evolución muestra al menos 6 meses terminando en el periodo elegido.
    const chartFrom = addMonths(startOfMonth(range.to), -5)
    return {
      summary: summarizePeriod(data.movements, memberIds, range),
      categories: expensesByCategory(
        data.movements,
        range,
        scope === 'mine' ? { userId: data.userId } : {},
      ),
      months: monthlyExpenses(
        data.movements,
        { from: chartFrom < range.from ? chartFrom : range.from, to: range.to },
        memberIds,
      ),
    }
    // memberIds se deriva de data.members
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.movements, data.members, data.userId, range.from, range.to, scope])

  const names = Object.fromEntries(
    data.members.map((member) => [member.userId, memberName(data, member.userId, { you: true })]),
  )
  const people = summary.people.filter(
    (person) =>
      data.members.find((member) => member.userId === person.userId)?.active ||
      person.paid + person.incomes > 0,
  )
  const maxPaid = Math.max(1, ...people.map((person) => person.paid))
  const maxCategory = Math.max(1, ...categories.map((entry) => entry.amount))
  const categoryTotal = categories.reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <Page width="lg">
      <PageHeader title="Reportes" />

      <div className="-mx-4 mb-6 flex flex-col gap-3 px-4">
        <div className="[scrollbar-width:none] overflow-x-auto pb-1">
          <div role="radiogroup" aria-label="Periodo" className="flex w-max gap-2">
            {presets.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={preset === value}
                onClick={() => setPreset(value)}
                className={`h-10 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                  preset === value
                    ? 'bg-fg text-canvas'
                    : 'bg-surface-2 text-fg-muted hover:text-fg'
                }`}
              >
                {periodLabels[value]}
              </button>
            ))}
          </div>
        </div>
        {preset === 'custom' && (
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <Field label="Desde">
              {({ id }) => (
                <TextInput
                  id={id}
                  type="date"
                  value={custom.from}
                  onChange={(event) =>
                    setCustom((value) => ({ ...value, from: event.target.value }))
                  }
                />
              )}
            </Field>
            <Field label="Hasta">
              {({ id }) => (
                <TextInput
                  id={id}
                  type="date"
                  value={custom.to}
                  onChange={(event) => setCustom((value) => ({ ...value, to: event.target.value }))}
                />
              )}
            </Field>
          </div>
        )}
      </div>

      {summary.expenseCount === 0 && summary.totalIncomes === 0 && summary.totalTransfers === 0 ? (
        <EmptyState icon={<ChartPieIcon />} title="Sin movimientos en este periodo">
          Elige otro periodo o registra un gasto para ver los reportes.
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Gastos">
            <div>
              <p className="text-sm text-fg-muted">Total del hogar</p>
              <p className="tabular text-3xl font-semibold tracking-tight">
                {formatMoney(summary.totalExpenses)}
              </p>
              <p className="text-sm text-fg-muted">
                {summary.expenseCount} {summary.expenseCount === 1 ? 'gasto' : 'gastos'}
              </p>
            </div>
            <dl className="flex flex-col gap-4">
              {people.map((person) => (
                <div key={person.userId} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <dt className="font-medium">{names[person.userId]}</dt>
                    <dd className="tabular">
                      aportó <span className="font-semibold">{formatMoney(person.paid)}</span>
                    </dd>
                  </div>
                  <div
                    aria-hidden="true"
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${Math.max(2, (person.paid / maxPaid) * 100)}%` }}
                  />
                  <dd className="tabular text-xs text-fg-muted">
                    le correspondía {formatMoney(person.share)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-fg-muted">
              "Aportó" es lo que cada uno pagó de su bolsillo; "le correspondía" es su parte según
              la división.
            </p>
          </Panel>

          <Panel title="Ingresos">
            <div>
              <p className="text-sm text-fg-muted">Total</p>
              <p className="tabular text-3xl font-semibold tracking-tight">
                {formatMoney(summary.totalIncomes)}
              </p>
            </div>
            <dl className="flex flex-col divide-y divide-line">
              {people.map((person) => (
                <div
                  key={person.userId}
                  className="flex items-baseline justify-between gap-3 py-2.5 text-sm"
                >
                  <dt className="font-medium">{names[person.userId]}</dt>
                  <dd className="tabular font-semibold">{formatMoney(person.incomes)}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 py-2.5 text-sm text-fg-muted">
                <dt>Transferencias entre ustedes</dt>
                <dd className="tabular">{formatMoney(summary.totalTransfers)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel
            title="Categorías"
            action={
              <div className="w-44">
                <Segmented
                  label="Qué sumar"
                  hideLabel
                  size="sm"
                  value={scope}
                  onChange={setScope}
                  options={[
                    { value: 'household', label: 'Hogar' },
                    { value: 'mine', label: 'Mi parte' },
                  ]}
                />
              </div>
            }
          >
            {categories.length === 0 ? (
              <p className="text-sm text-fg-muted">Sin gastos en este periodo.</p>
            ) : (
              <table className="w-full text-sm">
                <caption className="sr-only">Gasto por categoría, de mayor a menor</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Categoría</th>
                    <th scope="col">Porcentaje</th>
                    <th scope="col">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((entry) => {
                    const category = data.categories.find((item) => item.id === entry.categoryId)
                    return (
                      <tr key={entry.categoryId ?? 'none'} className="align-top">
                        <th scope="row" className="py-2 pr-3 text-left font-medium">
                          <span className="flex items-center gap-2">
                            <CategoryIcon
                              icon={category?.icon}
                              className="size-4 shrink-0 text-fg-muted"
                            />
                            {category?.name ?? 'Sin categoría'}
                          </span>
                          <span
                            aria-hidden="true"
                            className="mt-1.5 block h-1.5 rounded-full bg-primary"
                            style={{ width: `${Math.max(2, (entry.amount / maxCategory) * 100)}%` }}
                          />
                        </th>
                        <td className="w-16 py-2 text-right tabular text-fg-muted">
                          {Math.round(entry.shareBp / 100)} %
                        </td>
                        <td className="w-28 py-2 text-right tabular font-semibold">
                          {formatMoney(entry.amount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line">
                    <th scope="row" className="pt-2 text-left font-medium text-fg-muted">
                      Total
                    </th>
                    <td />
                    <td className="pt-2 text-right tabular font-semibold">
                      {formatMoney(categoryTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </Panel>

          <Panel title="Evolución mensual">
            <MonthlyChart months={months} names={names} />
          </Panel>
        </div>
      )}
    </Page>
  )
}
