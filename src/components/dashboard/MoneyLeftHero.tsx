import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CaretRightIcon, QuestionIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { memberName, personColor, useHousehold } from '../../app/household-context'
import { formatMonthName } from '../../lib/dates'
import { formatMoney, formatSigned } from '../../lib/money'
import { usingFromOthers, type AvailableSummary } from '../../lib/calculations/available'
import { PersonAvatar } from '../people/PersonColor'
import { ButtonLink } from '../ui/Button'
import { buttonClasses } from '../ui/buttonClasses'
import { Sheet } from '../ui/Sheet'

interface MoneyLeftHeroProps {
  people: AvailableSummary[]
  month: string
}

const personPath = (userId: string) =>
  `/movimientos?${new URLSearchParams({ periodo: 'month', persona: userId })}`

/** Lo que tuvo para gastar en el mes: lo que traía (si era positivo) más lo que le entró. */
const funds = (person: AvailableSummary) =>
  Math.max(0, person.carried) + person.incomes + person.received

/** Barra de saldo sobre lo que tuvo para gastar: más llena = más dinero (el texto dice lo mismo). */
function LeftBar({ person }: { person: AvailableSummary }) {
  const total = funds(person)
  const ratio = total > 0 ? Math.min(1, Math.max(0, person.balance) / total) : 0
  return (
    <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-positive" style={{ width: `${ratio * 100}%` }} />
    </div>
  )
}

const moved = (person: AvailableSummary) =>
  person.carried !== 0 || person.incomes + person.share + person.received + person.sent > 0

/**
 * Inicio: el saldo disponible de cada uno. Cada gasto resta a cada persona su parte, la pagara
 * quien la pagara; no hay deudas. Solo si a alguien se le acaba el saldo está usando el del otro.
 * Al hacer scroll se compacta en una barra fija.
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
      (data.members.find((member) => member.userId === person.userId)?.active || moved(person)),
  )
  const otherName = others.length === 1 ? memberName(data, others[0].userId) : null
  const monthName = formatMonthName(month)
  const balance = me?.balance ?? 0
  const empty = !me || !moved(me)
  const over = balance < 0
  const using = usingFromOthers(people, data.userId)
  const lead = over ? 'Se te acabó el saldo: vas en' : 'Tu saldo disponible'
  const shown = over ? formatSigned(balance) : formatMoney(balance)

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
          <span className="sr-only">{shown}</span>
        </h1>
        <p
          aria-hidden="true"
          className={`mt-1 tabular text-[clamp(2.25rem,12vw,3.75rem)] leading-tight font-semibold tracking-tight [overflow-wrap:anywhere] ${over ? 'text-negative' : ''}`}
        >
          {shown}
        </p>

        {empty ? (
          <div className="mt-3 flex flex-col items-start gap-3">
            <p className="text-fg-muted">
              Registra lo que te entró y cada gasto se irá descontando de tu saldo según tu parte.
            </p>
            <ButtonLink to="/ingresos/nuevo" variant="secondary" size="sm">
              Registrar un ingreso
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-4 flex max-w-xl flex-col gap-2">
            {over && (
              <p className="text-fg">
                {using > 0
                  ? `Estás usando ${formatMoney(using)} del saldo de ${otherName ?? 'los demás'}.`
                  : 'Registra lo que te entró para volver a tener saldo.'}
              </p>
            )}
            <LeftBar person={me} />
            <p className="flex flex-wrap justify-between gap-x-4 text-sm text-fg-muted">
              <span>
                En {monthName} te entraron{' '}
                <span className="tabular text-fg">{formatMoney(me.incomes)}</span>
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
              const short = person.balance < 0
              const takes = usingFromOthers(people, person.userId)
              return (
                <li key={person.userId}>
                  <Link
                    to={personPath(person.userId)}
                    className="flex flex-col gap-2 rounded-2xl bg-surface px-4 py-3 transition-colors hover:bg-surface-2/50"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="inline-flex items-center gap-2 font-medium">
                        <PersonAvatar name={name} color={personColor(data, person.userId)} />
                        Saldo de {name}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={`tabular font-semibold ${short ? 'text-negative' : ''}`}>
                          {short ? formatSigned(person.balance) : formatMoney(person.balance)}
                        </span>
                        <CaretRightIcon aria-hidden="true" className="size-4 text-fg-muted" />
                      </span>
                    </span>
                    <LeftBar person={person} />
                    {short && takes > 0 ? (
                      <span className="text-sm font-medium text-negative">
                        Se le acabó: está usando {formatMoney(takes)}{' '}
                        {others.length === 1 ? 'de tu saldo' : 'del saldo de los demás'}
                      </span>
                    ) : (
                      <span className="flex flex-wrap justify-between gap-x-4 text-sm text-fg-muted">
                        <span>
                          Le entraron <span className="tabular">{formatMoney(person.incomes)}</span>
                        </span>
                        <span>
                          Su parte de los gastos{' '}
                          <span className="tabular">{formatMoney(person.share)}</span>
                        </span>
                      </span>
                    )}
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
              Cada gasto se descuenta del saldo de cada uno según su parte, sin importar quién lo
              pagó: si gastan $30.000 a medias, a cada uno se le restan $15.000. No hay deudas entre
              ustedes; solo si a alguien se le acaba el saldo, está usando el del otro. Lo que sobra
              pasa al mes siguiente. No es el saldo de tu cuenta del banco.
            </p>
            <dl className="flex flex-col divide-y divide-line rounded-xl bg-surface-2 px-4">
              {[
                {
                  label: 'Venías con',
                  hint: `Tu saldo al empezar ${monthName}.`,
                  value: me.carried,
                  show: true,
                },
                {
                  label: 'Te entraron',
                  hint: 'Tus ingresos y tu parte de los compartidos.',
                  value: me.incomes,
                  show: true,
                },
                {
                  label: 'Tu parte de los gastos',
                  hint: 'Los pagara quien los pagara.',
                  value: -me.share,
                  show: true,
                },
                {
                  label: 'Te pasaron',
                  hint: 'Transferencias que recibiste.',
                  value: me.received,
                  show: me.received > 0,
                },
                {
                  label: 'Pasaste',
                  hint: 'Transferencias que enviaste.',
                  value: -me.sent,
                  show: me.sent > 0,
                },
              ]
                .filter((row) => row.show)
                .map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4 py-3">
                    <dt className="flex flex-col">
                      <span className="font-medium">{row.label}</span>
                      <span className="text-sm text-fg-muted">{row.hint}</span>
                    </dt>
                    <dd className="shrink-0 tabular font-semibold">{formatSigned(row.value)}</dd>
                  </div>
                ))}
              <div className="flex items-start justify-between gap-4 border-t-[3px] border-double border-line-strong py-3">
                <dt className="font-semibold">Tu saldo disponible</dt>
                <dd className={`tabular font-semibold ${over ? 'text-negative' : ''}`}>{shown}</dd>
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
            {shown}
          </span>
        </div>
      </div>
    </>
  )
}
