import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CaretRightIcon, QuestionIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { memberName, useHousehold } from '../../app/household-context'
import { formatMonthName } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import type { PersonSummary } from '../../lib/calculations/reports'
import { ButtonLink } from '../ui/Button'
import { buttonClasses } from '../ui/buttonClasses'
import { Sheet } from '../ui/Sheet'

interface MoneyLeftHeroProps {
  people: PersonSummary[]
  month: string
}

const personPath = (userId: string) =>
  `/movimientos?${new URLSearchParams({ periodo: 'month', persona: userId })}`

/** Barra de lo que queda sobre lo que le entró: más llena = más dinero (el texto dice lo mismo). */
function LeftBar({ person }: { person: PersonSummary }) {
  const ratio = person.incomes > 0 ? Math.max(0, person.left) / person.incomes : 0
  return (
    <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-positive" style={{ width: `${ratio * 100}%` }} />
    </div>
  )
}

/** Sin ingresos registrados aún: no es que se haya pasado, es que falta registrar lo que entró. */
const waitingIncome = (person: PersonSummary) => person.incomes === 0 && person.share > 0

/**
 * Inicio: cuánto le queda a cada uno del dinero del mes (su parte de los ingresos menos su parte
 * de los gastos). Al hacer scroll se compacta en una barra fija.
 */
export function MoneyLeftHero({ people, month }: MoneyLeftHeroProps) {
  const data = useHousehold()
  const sentinel = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)
  const [explaining, setExplaining] = useState(false)

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
  const empty = !me || (me.incomes === 0 && me.share === 0)
  const waiting = Boolean(me && waitingIncome(me))
  const over = left < 0 && !waiting
  const shown = waiting ? (me?.share ?? 0) : Math.abs(left)
  const lead = waiting
    ? 'Llevas en gastos este mes'
    : over
      ? 'Te pasaste este mes por'
      : `Te queda en ${monthName}`

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
              {lead}
            </span>
          ) : (
            lead
          )}{' '}
          <span className="sr-only">{formatMoney(shown)}</span>
        </h1>
        <p
          aria-hidden="true"
          className={`mt-1 tabular text-[clamp(2.25rem,12vw,3.75rem)] leading-tight font-semibold tracking-tight [overflow-wrap:anywhere] ${over ? 'text-negative' : ''}`}
        >
          {formatMoney(shown)}
        </p>

        {waiting ? (
          <div className="mt-3 flex flex-col items-start gap-3">
            <p className="text-fg-muted">
              Aún no registras lo que te entró este mes. Cuando lo hagas, aquí verás cuánto te
              queda.
            </p>
            <ButtonLink to="/ingresos/nuevo" variant="secondary" size="sm">
              Registrar un ingreso
            </ButtonLink>
          </div>
        ) : empty ? (
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
            <LeftBar person={me} />
            <p className="flex flex-wrap justify-between gap-x-4 text-sm text-fg-muted">
              <span>
                Te entraron <span className="tabular text-fg">{formatMoney(me.incomes)}</span>
              </span>
              <span>
                Tu parte de los gastos{' '}
                <span className="tabular text-fg">{formatMoney(me.share)}</span>
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-x-2">
              <Link
                to={personPath(data.userId)}
                className={buttonClasses('ghost', 'sm', '-ml-3.5')}
              >
                Tus movimientos del mes
              </Link>
              <button
                type="button"
                onClick={() => setExplaining(true)}
                className={buttonClasses('ghost', 'sm', 'text-fg-muted hover:text-fg')}
              >
                <QuestionIcon aria-hidden="true" className="size-4" weight="bold" />
                ¿Cómo se calcula?
              </button>
            </div>
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
                    className="flex flex-col gap-2 rounded-2xl bg-surface px-4 py-3 transition-colors hover:bg-surface-2/50"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">
                        {waitingIncome(person)
                          ? `${name} lleva en gastos`
                          : person.left < 0
                            ? `${name} se pasó por`
                            : `A ${name} le queda`}
                      </span>
                      <span className="flex items-center gap-1">
                        <span
                          className={`tabular font-semibold ${person.left < 0 && !waitingIncome(person) ? 'text-negative' : ''}`}
                        >
                          {formatMoney(
                            waitingIncome(person) ? person.share : Math.abs(person.left),
                          )}
                        </span>
                        <CaretRightIcon aria-hidden="true" className="size-4 text-fg-muted" />
                      </span>
                    </span>
                    <LeftBar person={person} />
                    <span className="flex flex-wrap justify-between gap-x-4 text-sm text-fg-muted">
                      <span>Le entraron {formatMoney(person.incomes)}</span>
                      <span>Su parte de los gastos {formatMoney(person.share)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        <div ref={sentinel} aria-hidden="true" />
        {me && (
          <Sheet open={explaining} onClose={() => setExplaining(false)} title="¿Cómo se calcula?">
            <p className="text-sm text-fg-muted">
              Lo que te queda es lo que te tocó de los ingresos del mes menos tu parte de los gastos
              del mes. Si {others.length === 1 ? memberName(data, others[0].userId) : 'alguien'}{' '}
              pagó algo que también era tuyo, tu parte cuenta igual aquí, y lo que le debes queda en
              «Cuentas entre ustedes». No es el saldo de tu cuenta del banco.
            </p>
            <dl className="flex flex-col divide-y divide-line rounded-xl bg-surface-2 px-4">
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="flex flex-col">
                  <span className="font-medium">Te entraron</span>
                  <span className="text-sm text-fg-muted">
                    Tus ingresos y tu parte de los compartidos.
                  </span>
                </dt>
                <dd className="shrink-0 tabular font-semibold">+{formatMoney(me.incomes)}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="flex flex-col">
                  <span className="font-medium">Tu parte de los gastos</span>
                  <span className="text-sm text-fg-muted">Los pagara quien los pagara.</span>
                </dt>
                <dd className="shrink-0 tabular font-semibold">−{formatMoney(me.share)}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-t-[3px] border-double border-line-strong py-3">
                <dt className="font-semibold">{left < 0 ? 'Te pasaste por' : 'Te queda'}</dt>
                <dd className="tabular font-semibold">{formatMoney(Math.abs(left))}</dd>
              </div>
            </dl>
          </Sheet>
        )}
      </section>

      <div
        aria-hidden={!compact}
        className={`fixed inset-x-0 top-0 z-20 border-b border-line bg-surface pt-safe transition-[opacity,translate] duration-200 ease-(--ease-out-expo) lg:left-[15.5rem] ${
          compact ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        } motion-reduce:translate-y-0`}
      >
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <span className="truncate text-sm text-fg-muted">{lead}</span>
          <span className={`tabular text-base font-semibold ${over ? 'text-negative' : 'text-fg'}`}>
            {formatMoney(shown)}
          </span>
        </div>
      </div>
    </>
  )
}
