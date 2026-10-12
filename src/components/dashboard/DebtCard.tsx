import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  QuestionIcon,
  UserPlusIcon,
} from '@phosphor-icons/react'
import { memberName, useHousehold } from '../../app/household-context'
import { formatMoney } from '../../lib/money'
import type { Debt } from '../../lib/calculations/balance'
import type { BalanceBreakdown, PeriodBridge } from '../../lib/calculations/ledger'
import { buttonClasses } from '../ui/buttonClasses'
import { BalanceExplainer } from './BalanceExplainer'

interface DebtCardProps {
  debts: Debt[]
  breakdown: BalanceBreakdown
  bridge: PeriodBridge
}

function settlePath(debt: Debt) {
  const params = new URLSearchParams({
    de: debt.debtor,
    para: debt.creditor,
    monto: String(debt.amount),
  })
  return `/transferencias/nueva?${params}`
}

/**
 * Cuentas entre ustedes: cuando uno paga algo del otro queda una deuda. Es secundario frente a
 * lo que le queda a cada uno, pero sigue a mano para saldarla.
 */
export function DebtCard({ debts, breakdown, bridge }: DebtCardProps) {
  const data = useHousehold()
  const [explaining, setExplaining] = useState(false)

  const activeOthers = data.members.filter(
    (member) => member.active && member.userId !== data.userId,
  )
  const mine = debts.filter((debt) => debt.debtor === data.userId || debt.creditor === data.userId)
  const primary = mine[0]

  let sentence: string
  let tone: 'positive' | 'negative' | 'settled'
  if (!primary) {
    sentence = 'Están a paz y salvo'
    tone = 'settled'
  } else if (primary.creditor === data.userId) {
    sentence = `${memberName(data, primary.debtor)} te debe`
    tone = 'positive'
  } else {
    sentence = `Le debes a ${memberName(data, primary.creditor)}`
    tone = 'negative'
  }

  const icon = {
    positive: <ArrowUpRightIcon aria-hidden="true" className="size-4" weight="bold" />,
    negative: <ArrowDownRightIcon aria-hidden="true" className="size-4" weight="bold" />,
    settled: <CheckIcon aria-hidden="true" className="size-4" weight="bold" />,
  }[tone]
  const toneClass = { positive: 'text-positive', negative: 'text-negative', settled: 'text-fg' }[
    tone
  ]

  return (
    <section aria-labelledby="entre-ustedes" className="rounded-2xl bg-surface p-(--card-p)">
      <h2 id="entre-ustedes" className="text-base font-semibold">
        Cuentas entre ustedes
      </h2>
      <p className="mt-1 text-sm text-fg-muted">
        Cuando uno paga algo que también es del otro, queda pendiente aquí.
      </p>
      <p className={`mt-4 flex items-center gap-1.5 font-medium ${toneClass}`}>
        {icon}
        {sentence}
      </p>
      {primary && (
        <p className="tabular text-3xl font-semibold tracking-tight">
          {formatMoney(primary.amount)}
        </p>
      )}
      {mine.length > 1 && (
        <ul className="mt-2 flex flex-col gap-1 text-sm text-fg-muted">
          {mine.slice(1).map((debt) => (
            <li key={`${debt.debtor}-${debt.creditor}`}>
              {debt.creditor === data.userId
                ? `${memberName(data, debt.debtor)} te debe ${formatMoney(debt.amount)}`
                : `Le debes ${formatMoney(debt.amount)} a ${memberName(data, debt.creditor)}`}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {primary && (
          <Link to={settlePath(primary)} className={buttonClasses('secondary', 'sm')}>
            Registrar abono
          </Link>
        )}
        <button
          type="button"
          onClick={() => setExplaining(true)}
          className={buttonClasses('ghost', 'sm', 'text-fg-muted hover:text-fg')}
        >
          <QuestionIcon aria-hidden="true" className="size-4" weight="bold" />
          ¿Cómo se calcula?
        </button>
        {activeOthers.length === 0 && (
          <Link to="/ajustes#invitar" className={buttonClasses('secondary', 'sm')}>
            <UserPlusIcon aria-hidden="true" className="size-4" weight="bold" />
            Invitar a tu hermano
          </Link>
        )}
      </div>
      <BalanceExplainer
        open={explaining}
        onClose={() => setExplaining(false)}
        breakdown={breakdown}
        bridge={bridge}
      />
    </section>
  )
}
