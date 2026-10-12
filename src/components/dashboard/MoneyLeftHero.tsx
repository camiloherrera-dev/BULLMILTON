import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CaretRightIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { memberName, useHousehold } from '../../app/household-context'
import { formatMonthName } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import type { PersonSummary } from '../../lib/calculations/reports'
import { ButtonLink } from '../ui/Button'

interface MoneyLeftHeroProps {
  people: PersonSummary[]
  month: string
}

const personPath = (userId: string) =>
  `/movimientos?${new URLSearchParams({ periodo: 'month', persona: userId })}`

/** Barra de lo gastado sobre lo que le entró (el texto al lado dice lo mismo en cifras). */
function SpentBar({ person }: { person: PersonSummary }) {
  const over = person.left < 0
  const ratio = person.incomes > 0 ? Math.min(1, person.share / person.incomes) : over ? 1 : 0
  return (
    <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-surface-2">
      <div
        className={`h-full rounded-full ${over ? 'bg-negative' : 'bg-primary'}`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  )
}

/**
 * Inicio: cuánto le queda a cada uno del dinero del mes (su parte de los ingresos menos su parte
 * de los gastos). Al hacer scroll se compacta en una barra fija.
 */
export function MoneyLeftHero({ people, month }: MoneyLeftHeroProps) {
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

  const me = people.find((person) => person.userId === data.userId)
  const others = people.filter(
    (person) =>
      person.userId !== data.userId &&
      (data.members.find((member) => member.userId === person.userId)?.active ||
        person.incomes + person.share > 0),
  )
  const monthName = formatMonthName(month)
  const left = me?.left ?? 0
  const over = left < 0
  const empty = !me || (me.incomes === 0 && me.share === 0)

  return (
    <>
      <section
        aria-labelledby="queda"
        className="pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 lg:pt-10"
      >
        <h1 id="queda" className="text-lg text-fg-muted">
          {over ? (
            <span className="inline-flex items-center gap-1.5 text-negative">
              <WarningCircleIcon aria-hidden="true" className="size-5" weight="bold" />
              Te pasaste este mes por
            </span>
          ) : (
            <>
              Te queda en <span className="first-letter:uppercase">{monthName}</span>
            </>
          )}
        </h1>
        <p
          className={`mt-1 tabular text-[clamp(2.25rem,12vw,3.75rem)] leading-tight font-semibold tracking-tight [overflow-wrap:anywhere] ${over ? 'text-negative' : ''}`}
        >
          {formatMoney(Math.abs(left))}
        </p>

        {empty ? (
          <div className="mt-3 flex flex-col items-start gap-3">
            <p className="text-fg-muted">
              Aún no tienes ingresos ni gastos este mes. Registra lo que te entró para ver cuánto te
              queda.
            </p>
            <ButtonLink to="/ingresos/nuevo" variant="secondary" size="sm">
              Registrar un ingreso
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-4 flex max-w-xl flex-col gap-2">
            <SpentBar person={me} />
            <p className="flex flex-wrap justify-between gap-x-4 text-sm text-fg-muted">
              <span>
                Te entraron <span className="tabular text-fg">{formatMoney(me.incomes)}</span>
              </span>
              <span>
                Gastaste <span className="tabular text-fg">{formatMoney(me.share)}</span>
              </span>
            </p>
            <Link
              to={personPath(data.userId)}
              className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-fg-muted underline hover:text-fg"
            >
              Ver tus movimientos del mes
            </Link>
          </div>
        )}

        {others.length > 0 && (
          <ul className="mt-4 flex max-w-xl flex-col gap-2">
            {others.map((person) => {
              const name = memberName(data, person.userId)
              return (
                <li key={person.userId}>
                  <Link
                    to={personPath(person.userId)}
                    className="flex flex-col gap-2 rounded-2xl bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">
                        {person.left < 0 ? `${name} se pasó por` : `A ${name} le queda`}
                      </span>
                      <span className="flex items-center gap-1">
                        <span
                          className={`tabular font-semibold ${person.left < 0 ? 'text-negative' : ''}`}
                        >
                          {formatMoney(Math.abs(person.left))}
                        </span>
                        <CaretRightIcon aria-hidden="true" className="size-4 text-fg-muted" />
                      </span>
                    </span>
                    <SpentBar person={person} />
                    <span className="flex flex-wrap justify-between gap-x-4 text-xs text-fg-muted">
                      <span>Le entraron {formatMoney(person.incomes)}</span>
                      <span>Gastó {formatMoney(person.share)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
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
          <span className="truncate text-sm text-fg-muted">
            {over ? 'Te pasaste este mes por' : 'Te queda este mes'}
          </span>
          <span className={`tabular text-base font-semibold ${over ? 'text-negative' : 'text-fg'}`}>
            {formatMoney(Math.abs(left))}
          </span>
        </div>
      </div>
    </>
  )
}
