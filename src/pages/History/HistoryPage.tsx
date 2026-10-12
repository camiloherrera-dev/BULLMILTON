import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { FunnelSimpleIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useHousehold } from '../../app/household-context'
import { buildLedger } from '../../lib/calculations/balance'
import { inRange } from '../../lib/calculations/reports'
import { todayBogota } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import { isPeriodPreset, periodLabels, resolvePeriod, type PeriodPreset } from '../../lib/periods'
import type { Movement, MovementKind } from '../../types/domain'
import { Ledger } from '../../components/dashboard/Ledger'
import { movementTitle } from '../../components/movements/describe'
import { Button } from '../../components/ui/Button'
import { Field, Select, TextInput, controlClasses } from '../../components/ui/Field'
import { Page, PageHeader } from '../../components/ui/PageHeader'
import { Segmented } from '../../components/ui/Segmented'
import { EmptyState } from '../../components/ui/States'

const PAGE_DAYS = 30

type KindFilter = 'all' | MovementKind

function involves(movement: Movement, userId: string): boolean {
  switch (movement.kind) {
    case 'expense':
      return movement.paidBy === userId || movement.splits.some((split) => split.userId === userId)
    case 'income':
      return movement.userId === userId
    case 'transfer':
      return movement.fromUser === userId || movement.toUser === userId
  }
}

/** Historial (spec §18): libro completo con filtros guardados en la URL. */
export function HistoryPage() {
  const data = useHousehold()
  const [params, setParams] = useSearchParams()
  const [visibleDays, setVisibleDays] = useState(PAGE_DAYS)
  const [showFilters, setShowFilters] = useState(false)
  const today = todayBogota()

  const preset: PeriodPreset = isPeriodPreset(params.get('periodo'))
    ? (params.get('periodo') as PeriodPreset)
    : 'all'
  const kind = (params.get('tipo') as KindFilter | null) ?? 'all'
  const categoryId = params.get('categoria') ?? ''
  const person = params.get('persona') ?? ''
  const query = params.get('q') ?? ''
  const showVoided = params.get('anulados') === '1'
  const range = resolvePeriod(preset, today, {
    from: params.get('desde') ?? undefined,
    to: params.get('hasta') ?? undefined,
  })

  const update = (changes: Record<string, string | null>) => {
    setVisibleDays(PAGE_DAYS)
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === '' || value === 'all') next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true },
    )
  }

  const activeFilters =
    Number(preset !== 'all') +
    Number(kind !== 'all') +
    Number(Boolean(categoryId)) +
    Number(Boolean(person)) +
    Number(showVoided)

  const { days, count, total } = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es')
    const matches = (movement: Movement) =>
      inRange(movement.date, range) &&
      (kind === 'all' || movement.kind === kind) &&
      (!categoryId || (movement.kind !== 'transfer' && movement.categoryId === categoryId)) &&
      (!person || involves(movement, person)) &&
      (!needle ||
        movementTitle(movement).toLocaleLowerCase('es').includes(needle) ||
        (movement.notes ?? '').toLocaleLowerCase('es').includes(needle))

    // El libro se arma con TODO el historial (para que los cierres sean correctos) y luego se
    // filtran las filas visibles.
    const ledger = buildLedger(data.movements, data.userId, { includeVoided: showVoided })
      .map((day) => ({ ...day, entries: day.entries.filter((entry) => matches(entry.movement)) }))
      .filter((day) => day.entries.length > 0)
    const entries = ledger.flatMap((day) => day.entries)
    return {
      days: ledger,
      count: entries.length,
      total: entries
        .filter((entry) => entry.movement.kind === 'expense' && entry.movement.status === 'active')
        .reduce((sum, entry) => sum + entry.movement.amount, 0),
    }
  }, [data.movements, data.userId, range, kind, categoryId, person, query, showVoided])

  const categories = data.categories.filter((category) => kind === 'all' || kind === category.kind)

  return (
    <Page width="lg">
      <PageHeader
        title="Movimientos"
        description={
          count > 0
            ? `${count} ${count === 1 ? 'movimiento' : 'movimientos'}${total > 0 ? `, ${formatMoney(total)} en gastos` : ''}`
            : undefined
        }
      />

      <div className="flex flex-col gap-3 pb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-muted"
            />
            <label htmlFor="buscar" className="sr-only">
              Buscar
            </label>
            <input
              id="buscar"
              type="search"
              placeholder="Buscar"
              value={query}
              onChange={(event) => update({ q: event.target.value })}
              className={`${controlClasses} h-12 pl-10`}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
            aria-controls="filtros"
            icon={<FunnelSimpleIcon aria-hidden="true" className="size-4" weight="bold" />}
          >
            Filtros{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </Button>
        </div>

        <Segmented<KindFilter>
          label="Tipo de movimiento"
          hideLabel
          size="sm"
          value={kind}
          onChange={(value) => update({ tipo: value, categoria: null })}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'expense', label: 'Gastos' },
            { value: 'income', label: 'Ingresos' },
            { value: 'transfer', label: 'Transf.' },
          ]}
        />

        {showFilters && (
          <div id="filtros" className="grid gap-4 rounded-2xl bg-surface p-4 sm:grid-cols-2">
            <Field label="Periodo">
              {({ id }) => (
                <Select
                  id={id}
                  value={preset}
                  onChange={(event) => update({ periodo: event.target.value })}
                >
                  {Object.entries(periodLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Persona">
              {({ id }) => (
                <Select
                  id={id}
                  value={person}
                  onChange={(event) => update({ persona: event.target.value })}
                >
                  <option value="">Cualquiera</option>
                  {data.members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.userId === data.userId ? 'Yo' : member.displayName}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {preset === 'custom' && (
              <>
                <Field label="Desde">
                  {({ id }) => (
                    <TextInput
                      id={id}
                      type="date"
                      value={range.from}
                      onChange={(event) => update({ desde: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="Hasta">
                  {({ id }) => (
                    <TextInput
                      id={id}
                      type="date"
                      value={range.to}
                      onChange={(event) => update({ hasta: event.target.value })}
                    />
                  )}
                </Field>
              </>
            )}
            {kind !== 'transfer' && (
              <Field label="Categoría">
                {({ id }) => (
                  <Select
                    id={id}
                    value={categoryId}
                    onChange={(event) => update({ categoria: event.target.value })}
                  >
                    <option value="">Todas</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                        {kind === 'all' ? (category.kind === 'income' ? ' (ingreso)' : '') : ''}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
            <label className="flex min-h-12 cursor-pointer items-center gap-3 self-end text-sm font-medium">
              <input
                type="checkbox"
                checked={showVoided}
                onChange={(event) => update({ anulados: event.target.checked ? '1' : null })}
                className="size-5 accent-(--color-primary)"
              />
              Mostrar anulados
            </label>
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                className="sm:col-span-2 sm:justify-self-start"
                onClick={() =>
                  update({
                    periodo: null,
                    tipo: null,
                    categoria: null,
                    persona: null,
                    anulados: null,
                    desde: null,
                    hasta: null,
                  })
                }
              >
                Quitar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {days.length === 0 ? (
        <EmptyState
          title={
            data.movements.length === 0 ? 'Aún no hay movimientos' : 'Nada coincide con los filtros'
          }
        >
          {data.movements.length === 0
            ? 'Registra un gasto, un ingreso o una transferencia y aparecerá aquí.'
            : 'Prueba con otro periodo o quita algún filtro.'}
        </EmptyState>
      ) : (
        <>
          <Ledger days={days.slice(0, visibleDays)} heading="Historial" />
          {days.length > visibleDays && (
            <Button
              variant="secondary"
              className="mt-6"
              onClick={() => setVisibleDays((value) => value + PAGE_DAYS)}
            >
              Mostrar más días
            </Button>
          )}
        </>
      )}
    </Page>
  )
}
