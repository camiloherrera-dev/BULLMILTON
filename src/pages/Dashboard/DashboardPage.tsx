import { useMemo } from 'react'
import { NotebookIcon } from '@phosphor-icons/react'
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
import { BalanceHero } from '../../components/dashboard/BalanceHero'
import { Ledger } from '../../components/dashboard/Ledger'
import { MonthSummary } from '../../components/dashboard/MonthSummary'
import { PendingRecurring } from '../../components/dashboard/PendingRecurring'
import { ButtonLink } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/States'

/** Inicio muestra solo lo último; el resto está en Movimientos. */
const LEDGER_ROWS = 8

/** Inicio: el libro diario del hogar (dirección "Libro diario", ver .impeccable/surfaces). */
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
      <BalanceHero
        myBalance={balance.balances[userId] ?? 0}
        debts={balance.debts}
        breakdown={breakdown}
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="xl:hidden">
            <PendingRecurring />
          </div>
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
              <Ledger days={ledger} heading="Últimos movimientos" />
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

        <aside className="flex flex-col gap-6 xl:sticky xl:top-8">
          <div className="hidden xl:block">
            <PendingRecurring />
          </div>
          <MonthSummary summary={summary} bridge={bridge} month={today} />
        </aside>
      </div>
    </div>
  )
}
