import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  UserPlusIcon,
} from '@phosphor-icons/react'
import { memberName, useHousehold } from '../../app/household-context'
import { formatMoney } from '../../lib/money'
import type { Debt } from '../../lib/calculations/balance'
import { buttonClasses } from '../ui/buttonClasses'

interface BalanceHeroProps {
  myBalance: number
  debts: Debt[]
}

function settlePath(debt: Debt) {
  const params = new URLSearchParams({
    de: debt.debtor,
    para: debt.creditor,
    monto: String(debt.amount),
  })
  return `/transferencias/nueva?${params}`
}

/** Saldo a escala grande; al hacer scroll se compacta en una barra fija (signature del libro). */
export function BalanceHero({ myBalance, debts }: BalanceHeroProps) {
  const data = useHousehold()
  const sentinel = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const element = sentinel.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), {
      rootMargin: '-8px 0px 0px 0px',
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const activeOthers = data.members.filter(
    (member) => member.active && member.userId !== data.userId,
  )
  const mine = debts.filter((debt) => debt.debtor === data.userId || debt.creditor === data.userId)
  const primary = mine[0]

  let sentence: string
  let tone: 'positive' | 'negative' | 'settled'
  if (!primary) {
    sentence = 'Todo saldado'
    tone = 'settled'
  } else if (primary.creditor === data.userId) {
    sentence = `${memberName(data, primary.debtor)} te debe`
    tone = 'positive'
  } else {
    sentence = `Le debes a ${memberName(data, primary.creditor)}`
    tone = 'negative'
  }
  const amount = primary ? primary.amount : 0

  const chip = {
    positive: {
      icon: <ArrowUpRightIcon aria-hidden="true" className="size-4" weight="bold" />,
      label: 'A tu favor',
      classes: 'bg-positive-bg text-positive',
    },
    negative: {
      icon: <ArrowDownRightIcon aria-hidden="true" className="size-4" weight="bold" />,
      label: 'En tu contra',
      classes: 'bg-negative-bg text-negative',
    },
    settled: {
      icon: <CheckIcon aria-hidden="true" className="size-4" weight="bold" />,
      label: 'Están a paz y salvo',
      classes: 'bg-surface-2 text-fg-muted',
    },
  }[tone]

  return (
    <>
      <section
        aria-labelledby="saldo"
        className="pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 lg:pt-10"
      >
        <h1 id="saldo" className="text-lg text-fg-muted">
          {sentence}
        </h1>
        <p className="mt-1 tabular text-[clamp(2.25rem,12vw,3.75rem)] leading-tight font-semibold tracking-tight [overflow-wrap:anywhere]">
          {formatMoney(amount)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium ${chip.classes}`}
          >
            {chip.icon}
            {chip.label}
          </span>
          {primary && (
            <Link to={settlePath(primary)} className={buttonClasses('secondary', 'sm')}>
              Registrar abono
            </Link>
          )}
          {activeOthers.length === 0 && (
            <Link to="/ajustes#invitar" className={buttonClasses('secondary', 'sm')}>
              <UserPlusIcon aria-hidden="true" className="size-4" weight="bold" />
              Invitar a tu hermano
            </Link>
          )}
        </div>
        {mine.length > 1 && (
          <ul className="mt-4 flex flex-col gap-1 text-sm text-fg-muted">
            {mine.slice(1).map((debt) => (
              <li key={`${debt.debtor}-${debt.creditor}`}>
                {debt.creditor === data.userId
                  ? `${memberName(data, debt.debtor)} te debe ${formatMoney(debt.amount)}`
                  : `Le debes ${formatMoney(debt.amount)} a ${memberName(data, debt.creditor)}`}
              </li>
            ))}
          </ul>
        )}
        <div ref={sentinel} aria-hidden="true" />
      </section>

      <div
        aria-hidden={!compact}
        className={`fixed inset-x-0 top-0 z-20 border-b border-line bg-surface pt-safe transition-[opacity,transform] duration-200 ease-(--ease-out-expo) lg:left-[15.5rem] ${
          compact ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <span className="truncate text-sm text-fg-muted">{sentence}</span>
          <span
            className={`tabular text-base font-semibold ${
              tone === 'positive'
                ? 'text-positive'
                : tone === 'negative'
                  ? 'text-negative'
                  : 'text-fg'
            }`}
          >
            {formatMoney(myBalance === 0 ? 0 : amount)}
          </span>
        </div>
      </div>
    </>
  )
}
