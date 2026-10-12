import { useHousehold } from '../../app/household-context'
import type { BalanceBreakdown, PeriodBridge } from '../../lib/calculations/ledger'
import { formatMoney, formatSigned } from '../../lib/money'
import { balancePhrase } from '../movements/describe'
import { Sheet } from '../ui/Sheet'

interface BalanceExplainerProps {
  open: boolean
  onClose: () => void
  breakdown: BalanceBreakdown
  /** Cómo cambió la cuenta este mes. */
  bridge: PeriodBridge
}

/** "¿Cómo se calcula?": el saldo desglosado en sus cuatro términos (docs/DATABASE.md). */
export function BalanceExplainer({ open, onClose, breakdown, bridge }: BalanceExplainerProps) {
  const data = useHousehold()
  const others = data.members.filter((member) => member.userId !== data.userId)
  const other = others.length === 1 ? others[0].displayName : null
  const result = balancePhrase(breakdown.balance, data)
  const start = balancePhrase(bridge.before, data, 'past')

  const allRows = [
    {
      label: 'Pagaste en gastos',
      hint: 'Todo lo que salió de tu bolsillo.',
      value: breakdown.paid,
    },
    {
      label: 'Lo que te correspondía',
      hint: 'Tu parte de todos los gastos, los pagara quien los pagara.',
      value: -breakdown.share,
    },
    {
      label: other ? `Le pasaste a ${other}` : 'Transferencias que hiciste',
      hint: 'Cuenta como si hubieras pagado.',
      value: breakdown.sent,
    },
    {
      label: other ? `${other} te pasó` : 'Transferencias que recibiste',
      hint: 'Cuenta como si te hubieran pagado.',
      value: -breakdown.received,
    },
  ]
  // Las transferencias en cero sobran; los gastos se dejan siempre para que la cuenta se lea.
  const rows = allRows.filter((row, index) => index < 2 || row.value !== 0)

  return (
    <Sheet open={open} onClose={onClose} title="¿Cómo se calcula?">
      <p className="text-sm text-fg-muted">
        Es la cuenta entre ustedes, desde el primer movimiento. Si pagaste más de lo que te
        correspondía, te deben la diferencia; si pagaste menos, la debes tú. Los ingresos no cuentan
        aquí: están en lo que le queda a cada uno.
      </p>
      <dl className="flex flex-col divide-y divide-line rounded-xl bg-surface-2 px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 py-3">
            <dt className="flex min-w-0 flex-col">
              <span className="font-medium">{row.label}</span>
              <span className="text-sm text-fg-muted">{row.hint}</span>
            </dt>
            <dd className="shrink-0 tabular font-semibold">{formatSigned(row.value)}</dd>
          </div>
        ))}
        <div className="flex items-start justify-between gap-4 border-t-[3px] border-double border-line-strong py-3">
          <dt className="font-semibold">Resultado</dt>
          <dd className="text-right font-semibold">
            <span className="tabular">{formatSigned(breakdown.balance)}</span>
            <span className="block text-sm font-medium text-fg-muted">
              {result.lead}
              {result.amount !== null && ` ${formatMoney(result.amount)}`}
            </span>
          </dd>
        </div>
      </dl>

      <h3 className="mt-2 font-semibold">Este mes</h3>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-fg-muted">Al empezar el mes</dt>
          <dd className="text-right">
            {start.lead}
            {start.amount !== null && (
              <span className="tabular font-semibold"> {formatMoney(start.amount)}</span>
            )}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-fg-muted">Por los gastos del mes</dt>
          <dd className="tabular font-semibold">{formatSigned(bridge.expenses)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-fg-muted">Por los abonos del mes</dt>
          <dd className="tabular font-semibold">{formatSigned(bridge.transfers)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t-[3px] border-double border-line-strong pt-2">
          <dt className="font-medium">Ahora</dt>
          <dd className="text-right font-medium">
            {result.lead}
            {result.amount !== null && (
              <span className="tabular font-semibold"> {formatMoney(result.amount)}</span>
            )}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-fg-muted">+ suma a tu favor · − resta</p>
    </Sheet>
  )
}
