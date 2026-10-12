import { useMemo, useState } from 'react'
import { ChartPieIcon, CreditCardIcon, FunnelSimpleIcon } from '@phosphor-icons/react'
import { memberName, personColor, useHousehold } from '../../app/household-context'
import {
  expenseCategoryIds,
  expensesByCategory,
  monthlyExpenses,
  summarizePeriod,
} from '../../lib/calculations/reports'
import { addMonths, startOfMonth, todayBogota } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import { periodLabels, resolvePeriod, type PeriodPreset } from '../../lib/periods'
import { resolvePersonColors } from '../../lib/people'
import { MonthlyChart } from '../../components/charts/MonthlyChart'
import { CategoryChips } from '../../components/forms/CategoryChips'
import { PersonAvatar } from '../../components/people/PersonColor'
import { personBg } from '../../components/people/personClasses'
import { CategoryIcon } from '../../components/movements/CategoryIcon'
import { categorySolid } from '../../components/movements/categoryColors'
import { Field, TextInput } from '../../components/ui/Field'
import { Page, PageHeader } from '../../components/ui/PageHeader'
import { ScrollFade } from '../../components/ui/ScrollFade'
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
    <section aria-label={title} className="flex flex-col gap-4 rounded-2xl bg-surface p-(--card-p)">
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
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)

  const range = resolvePeriod(preset, today, custom)
  const memberIds = data.members.map((member) => member.userId)

  const { summary, categories, months } = useMemo(() => {
    // Filtro por categorías: solo afecta a los gastos (ingresos y transferencias siguen).
    const movements =
      categoryFilter.length === 0
        ? data.movements
        : data.movements.filter(
            (movement) =>
              movement.kind !== 'expense' ||
              expenseCategoryIds(movement).some((id) => categoryFilter.includes(id)),
          )
    // La evolución muestra al menos 6 meses terminando en el periodo elegido.
    const chartFrom = addMonths(startOfMonth(range.to), -5)
    return {
      summary: summarizePeriod(movements, memberIds, range),
      categories: expensesByCategory(
        movements,
        range,
        scope === 'mine' ? { userId: data.userId } : {},
      ),
      months: monthlyExpenses(
        movements,
        { from: chartFrom < range.from ? chartFrom : range.from, to: range.to },
        memberIds,
      ),
    }
    // memberIds se deriva de data.members
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.movements, data.members, data.userId, range.from, range.to, scope, categoryFilter])

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
        <ScrollFade className="pb-1">
          <div role="radiogroup" aria-label="Periodo" className="flex w-max gap-2">
            {presets.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={preset === value}
                onClick={() => setPreset(value)}
                className={`h-11 rounded-full px-4 text-sm whitespace-nowrap transition-colors duration-150 ${
                  preset === value
                    ? 'bg-fg font-semibold text-canvas'
                    : 'bg-surface-2 font-medium text-fg-muted hover:text-fg'
                }`}
              >
                {periodLabels[value]}
              </button>
            ))}
          </div>
        </ScrollFade>
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
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowCategoryFilter((value) => !value)}
            aria-expanded={showCategoryFilter}
            aria-controls="filtro-categorias"
            className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-medium text-fg-muted hover:text-fg"
          >
            <FunnelSimpleIcon aria-hidden="true" className="size-4" weight="bold" />
            {categoryFilter.length > 0
              ? `Categorías (${categoryFilter.length})`
              : 'Filtrar por categorías'}
          </button>
          {showCategoryFilter && (
            <div id="filtro-categorias" className="rounded-2xl bg-surface p-4">
              <CategoryChips
                label="Solo gastos de estas categorías"
                categories={data.categories.filter(
                  (category) => category.kind === 'expense' && !category.archivedAt,
                )}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
            </div>
          )}
          {categoryFilter.length > 0 && (
            <p className="text-sm text-fg-muted">
              Los gastos están filtrados por categoría; los ingresos y transferencias no.
            </p>
          )}
        </div>
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
                {summary.cardExpenses > 0 && (
                  <>
                    {' · '}
                    <CreditCardIcon
                      aria-hidden="true"
                      className="inline size-4 align-[-0.15em]"
                    />{' '}
                    con tarjeta{' '}
                    <span className="tabular font-semibold text-fg">
                      {formatMoney(summary.cardExpenses)}
                    </span>
                  </>
                )}
              </p>
            </div>
            <ul className="flex flex-col gap-4">
              {people.map((person) => (
                <li key={person.userId} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <PersonAvatar
                        name={memberName(data, person.userId)}
                        color={personColor(data, person.userId)}
                        size="sm"
                      />
                      {names[person.userId]}
                    </span>
                    <span className="tabular">
                      {person.userId === data.userId ? 'aportaste' : 'aportó'}{' '}
                      <span className="font-semibold">{formatMoney(person.paid)}</span>
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className={`h-1.5 rounded-full ${personBg[personColor(data, person.userId)]}`}
                    style={{ width: `${(person.paid / maxPaid) * 100}%` }}
                  />
                  <span className="tabular text-xs text-fg-muted">
                    {person.userId === data.userId ? 'te correspondía' : 'le correspondía'}{' '}
                    {formatMoney(person.share)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-fg-muted">
              Lo aportado es lo que cada uno pagó de su bolsillo; lo que correspondía es su parte
              según la división de cada gasto.
            </p>
          </Panel>

          <Panel title="Lo que le queda a cada uno">
            <div>
              <p className="text-sm text-fg-muted">Ingresos del periodo</p>
              <p className="tabular text-3xl font-semibold tracking-tight">
                {formatMoney(summary.totalIncomes)}
              </p>
            </div>
            <ul className="flex flex-col divide-y divide-line">
              {people.map((person) => (
                <li key={person.userId} className="flex flex-col gap-1 py-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{names[person.userId]}</span>
                    <span
                      className={`tabular font-semibold ${person.left < 0 ? 'text-negative' : ''}`}
                    >
                      {person.left < 0
                        ? `se pasó por ${formatMoney(-person.left)}`
                        : `le queda ${formatMoney(person.left)}`}
                    </span>
                  </div>
                  <span className="flex flex-wrap justify-between gap-x-3 tabular text-xs text-fg-muted">
                    <span>le entró {formatMoney(person.incomes)}</span>
                    <span>gastó {formatMoney(person.share)}</span>
                  </span>
                </li>
              ))}
              <li className="flex items-baseline justify-between gap-3 py-2.5 text-sm text-fg-muted">
                <span>Transferencias entre ustedes</span>
                <span className="tabular">{formatMoney(summary.totalTransfers)}</span>
              </li>
            </ul>
            <p className="text-xs text-fg-muted">
              Le queda = su parte de los ingresos menos su parte de los gastos. Las transferencias
              solo saldan cuentas entre ustedes, no cambian lo que le queda a nadie.
            </p>
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
              <>
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
                              className={`mt-1.5 block h-1.5 rounded-full ${category?.color ? categorySolid[category.color] : 'bg-primary'}`}
                              style={{
                                width: `${Math.max(2, (entry.amount / maxCategory) * 100)}%`,
                              }}
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
                {scope === 'household' && categoryTotal > summary.totalExpenses && (
                  <p className="text-xs text-fg-muted">
                    Hay gastos con varias categorías: cuentan completos en cada una, por eso la suma
                    supera el total gastado ({formatMoney(summary.totalExpenses)}).
                  </p>
                )}
              </>
            )}
          </Panel>

          <Panel title="Evolución mensual">
            <MonthlyChart
              months={months}
              names={names}
              colors={resolvePersonColors(data.members)}
            />
          </Panel>
        </div>
      )}
    </Page>
  )
}
