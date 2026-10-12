import { useHousehold } from '../../app/household-context'
import type { BalanceBreakdown } from '../../lib/calculations/ledger'
import { formatMoney, formatSigned } from '../../lib/money'
import { balancePhrase } from '../movements/describe'
import { Sheet } from '../ui/Sheet'

interface BalanceExplainerProps {
  open: boolean
  onClose: () => void
  breakdown: BalanceBreakdown
}

/** "¿Cómo se calcula?": el saldo desglosado en sus cuatro términos (docs/DATABASE.md). */
export function BalanceExplainer({ open, onClose, breakdown }: BalanceExplainerProps) {
  const data = useHousehold()
  const others = data.members.filter((member) => member.userId !== data.userId)
  const other = others.length === 1 ? others[0].displayName : null
  const result = balancePhrase(breakdown.balance, data)

  const rows = [
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

  return (
    <Sheet open={open} onClose={onClose} title="¿Cómo se calcula?">
      <p className="text-sm text-fg-muted">
        Se suma todo desde el primer movimiento, no solo este mes. Si pagaste más de lo que te
        correspondía, te deben la diferencia; si pagaste menos, la debes tú. Los ingresos no
        cuentan.
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
    </Sheet>
  )
}
