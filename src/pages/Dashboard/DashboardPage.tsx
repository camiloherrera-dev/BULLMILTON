import { useMemo } from 'react'
import { Link } from 'react-router'
import { NotebookIcon } from '@phosphor-icons/react'
import { useHousehold } from '../../app/household-context'
import { buildLedger, calculateBalance, toBalanceInput } from '../../lib/calculations/balance'
import { summarizePeriod } from '../../lib/calculations/reports'
import { endOfMonth, startOfMonth, todayBogota } from '../../lib/dates'
import { BalanceHero } from '../../components/dashboard/BalanceHero'
import { Ledger } from '../../components/dashboard/Ledger'
import { MonthSummary } from '../../components/dashboard/MonthSummary'
import { PendingRecurring } from '../../components/dashboard/PendingRecurring'
import { ButtonLink } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/States'

const LEDGER_DAYS = 14

/** Inicio: el libro diario del hogar (dirección "Libro diario", ver .impeccable/surfaces). */
export function DashboardPage() {
  const data = useHousehold()
  const { movements, members, userId } = data
  const today = todayBogota()

  const { balance, ledger, summary, totalDays } = useMemo(() => {
    const memberIds = members.map((member) => member.userId)
    const fullLedger = buildLedger(movements, userId)
    return {
      balance: calculateBalance(toBalanceInput(movements, memberIds)),
      ledger: fullLedger.slice(0, LEDGER_DAYS),
      totalDays: fullLedger.length,
      summary: summarizePeriod(movements, memberIds, {
        from: startOfMonth(today),
        to: endOfMonth(today),
      }),
    }
  }, [movements, members, userId, today])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-10">
      <BalanceHero myBalance={balance.balances[userId] ?? 0} debts={balance.debts} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <PendingRecurring />
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
              <Ledger days={ledger} />
              {totalDays > LEDGER_DAYS && (
                <Link
                  to="/movimientos"
                  className="self-start text-sm font-medium text-fg-muted underline hover:text-fg"
                >
                  Ver todo el historial
                </Link>
              )}
            </>
          )}
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-8">
          <MonthSummary summary={summary} month={today} />
        </aside>
      </div>
    </div>
  )
}
