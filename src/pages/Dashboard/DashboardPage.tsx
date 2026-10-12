import { useMemo } from 'react'
import { Link } from 'react-router'
import { CaretRightIcon, NotebookIcon } from '@phosphor-icons/react'
import { useHousehold } from '../../app/household-context'
import { buildLedger, calculateBalance, toBalanceInput } from '../../lib/calculations/balance'
import {
  annotateLedger,
  balanceBreakdown,
  limitEntries,
  periodBridge,
} from '../../lib/calculations/ledger'
import { summarizePeriod } from '../../lib/calculations/reports'
import { endOfMonth, startOfMonth, todayBogota } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import { DebtCard } from '../../components/dashboard/DebtCard'
import { Ledger } from '../../components/dashboard/Ledger'
import { MoneyLeftHero } from '../../components/dashboard/MoneyLeftHero'
import { MonthSummary } from '../../components/dashboard/MonthSummary'
import { PendingRecurring } from '../../components/dashboard/PendingRecurring'
import { ButtonLink } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/States'

/** Inicio muestra solo lo último; el resto está en Movimientos. */
const LEDGER_ROWS = 8

/**
 * Inicio: cuánto le queda a cada uno este mes, las cuentas entre ustedes y el libro diario
 * (dirección "Libro diario", ver .impeccable/surfaces).
 */
export function DashboardPage() {
  const data = useHousehold()
  const { movements, members, userId } = data
  const today = todayBogota()

  const { balance, breakdown, ledger, bridge, summary, totalRows } = useMemo(() => {
    const memberIds = members.map((member) => member.userId)
    const fullLedger = annotateLedger(buildLedger(movements, userId))
    const month = { from: startOfMonth(today), to: endOfMonth(today) }
    return {
      balance: calculateBalance(toBalanceInput(movements, memberIds)),
      breakdown: balanceBreakdown(movements, userId),
      ledger: limitEntries(fullLedger, LEDGER_ROWS),
      totalRows: fullLedger.reduce((sum, day) => sum + day.entries.length, 0),
      bridge: periodBridge(movements, userId, month),
      summary: summarizePeriod(movements, memberIds, month),
    }
  }, [movements, members, userId, today])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-10">
      <MoneyLeftHero people={summary.people} month={today} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:grid-rows-[auto_1fr] xl:items-start xl:gap-x-8">
        <div className="flex flex-col gap-6 xl:col-start-2 xl:row-start-1">
          <PendingRecurring />
          <DebtCard debts={balance.debts} breakdown={breakdown} bridge={bridge} />
        </div>
        <div className="flex min-w-0 flex-col gap-6 xl:col-start-1 xl:row-span-2 xl:row-start-1">
          {ledger.length === 0 ? (
            <EmptyState
              icon={<NotebookIcon />}
              title="Tu libro está en blanco"
              action={<ButtonLink to="/gastos/nuevo">Registrar el primer gasto</ButtonLink>}
            >
              Cada gasto, ingreso o transferencia aparecerá aquí, agrupado por día y con el saldo al
              cierre.
            </EmptyState>
          ) : (
            <>
              <Ledger days={ledger} heading="Últimos movimientos" dayLevel="h3" />
              <ButtonLink
                to="/movimientos"
                variant="secondary"
                className="w-full sm:w-auto sm:self-start"
              >
                {totalRows > LEDGER_ROWS
                  ? `Ver todo el historial (${totalRows})`
                  : 'Ver todo el historial'}
              </ButtonLink>
            </>
          )}
        </div>
        <div className="xl:col-start-2 xl:row-start-2">
          {/* En el celular basta una línea (lo demás está arriba y en Reportes). */}
          <div className="hidden lg:block">
            <MonthSummary summary={summary} month={today} />
          </div>
          <Link
            to="/reportes"
            className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 transition-colors hover:bg-surface-2/50 lg:hidden"
          >
            <span className="flex flex-col">
              <span className="text-sm text-fg-muted">Gastado entre los dos este mes</span>
              <span className="tabular font-semibold">{formatMoney(summary.totalExpenses)}</span>
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-fg-muted">
              Reportes
              <CaretRightIcon aria-hidden="true" className="size-4" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
