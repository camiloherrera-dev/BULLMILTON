import { describe, expect, it } from 'vitest'
import type { Expense, Income, Movement, Transfer } from '../../types/domain'
import { buildLedger, calculateBalances, toBalanceInput } from './balance'
import { annotateLedger, balanceBreakdown, limitEntries, periodBridge } from './ledger'
import { summarizePeriod } from './reports'

const A = 'aaaaaaaa-0000-4000-8000-000000000001'
const B = 'bbbbbbbb-0000-4000-8000-000000000002'

let sequence = 0
const audit = () => {
  sequence += 1
  const createdAt = new Date(Date.UTC(2026, 9, 1, 0, 0, sequence)).toISOString()
  return { createdBy: A, createdAt, updatedBy: A, updatedAt: createdAt }
}

function expense(
  paidBy: string,
  amount: number,
  shares: Record<string, number>,
  extra: Partial<Expense> = {},
): Expense {
  return {
    kind: 'expense',
    id: `e${(sequence += 1)}`,
    description: 'Gasto',
    amount,
    currency: 'COP',
    date: '2026-10-01',
    categoryId: 'cat',
    paidBy,
    splitType: 'percentage',
    splits: Object.entries(shares).map(([userId, splitAmount]) => ({
      userId,
      shareBp: Math.round((splitAmount / amount) * 10000),
      amount: splitAmount,
    })),
    notes: null,
    status: 'active',
    extraCategoryIds: [],
    paidWithCard: false,
    recurringExpenseId: null,
    ...audit(),
    ...extra,
  }
}

function transfer(
  fromUser: string,
  toUser: string,
  amount: number,
  extra: Partial<Transfer> = {},
): Transfer {
  return {
    kind: 'transfer',
    id: `t${(sequence += 1)}`,
    fromUser,
    toUser,
    amount,
    currency: 'COP',
    date: '2026-10-01',
    notes: null,
    status: 'active',
    ...audit(),
    ...extra,
  }
}

function income(userId: string, amount: number, extra: Partial<Income> = {}): Income {
  return {
    kind: 'income',
    id: `i${(sequence += 1)}`,
    userId,
    source: 'Salario',
    amount,
    currency: 'COP',
    date: '2026-10-01',
    categoryId: null,
    splitType: 'equal',
    splits: [{ userId, shareBp: 10000, amount }],
    notes: null,
    status: 'active',
    ...audit(),
    ...extra,
  }
}

// Más reciente primero, como llegan de la base de datos.
const movements: Movement[] = [
  transfer(B, A, 300_000, { date: '2026-10-06' }),
  expense(B, 120_000, { [A]: 60_000, [B]: 60_000 }, { date: '2026-10-06' }),
  income(A, 3_000_000, { date: '2026-10-05' }),
  expense(A, 95_000, { [A]: 66_500, [B]: 28_500 }, { date: '2026-10-05' }),
  expense(A, 999, { [A]: 500, [B]: 499 }, { date: '2026-10-04', status: 'voided' }),
  expense(B, 44_900, { [A]: 22_450, [B]: 22_450 }, { date: '2026-09-28' }),
  expense(A, 1_000_000, { [A]: 500_000, [B]: 500_000 }, { date: '2026-09-15' }),
]

describe('annotateLedger', () => {
  const days = annotateLedger(buildLedger(movements, A, { includeVoided: true }))
  const entries = days.flatMap((day) => day.entries)

  it('el saldo después de la fila más reciente es el saldo actual', () => {
    expect(entries[0].after).toBe(calculateBalances(toBalanceInput(movements))[A])
  })

  it('cada fila encadena con la siguiente: su "antes" es el "después" de la anterior', () => {
    for (let index = 0; index < entries.length - 1; index += 1) {
      expect(entries[index].before).toBe(entries[index + 1].after)
    }
    expect(entries.at(-1)?.before).toBe(0)
  })

  it('after = before + effect en todas las filas', () => {
    for (const entry of entries) expect(entry.after).toBe(entry.before + entry.effect)
  })

  it('el abono de B a A baja el saldo de A en 300.000', () => {
    const payment = entries.find((entry) => entry.movement.kind === 'transfer')!
    expect(payment.effect).toBe(-300_000)
    expect(payment.after).toBe(payment.before - 300_000)
    expect(payment.after).toBe(entries[0].after)
  })

  it('los anulados e ingresos no mueven el saldo', () => {
    for (const entry of entries.filter(
      (item) => item.movement.kind === 'income' || item.movement.status === 'voided',
    ))
      expect(entry.before).toBe(entry.after)
  })

  it('desde el otro lado todos los saldos tienen signo opuesto', () => {
    const fromB = annotateLedger(buildLedger(movements, B, { includeVoided: true })).flatMap(
      (day) => day.entries,
    )
    expect(fromB.map((entry) => entry.after)).toEqual(entries.map((entry) => -entry.after || 0))
  })
})

describe('limitEntries', () => {
  const days = buildLedger(movements, A)

  it('corta en el número de filas pedido, aunque el último día quede a medias', () => {
    const limited = limitEntries(days, 3)
    expect(limited.flatMap((day) => day.entries)).toHaveLength(3)
    expect(limited.map((day) => day.date)).toEqual(['2026-10-06', '2026-10-05'])
    expect(limited[1].entries).toHaveLength(1)
  })

  it('no cambia los cierres de día', () => {
    const limited = limitEntries(days, 3)
    expect(limited.map((day) => day.closingBalance)).toEqual(
      days.slice(0, 2).map((day) => day.closingBalance),
    )
  })

  it('si hay menos filas que el límite devuelve todo', () => {
    expect(limitEntries(days, 100)).toEqual(days)
  })
})

describe('balanceBreakdown', () => {
  it('pagado − su parte + enviado − recibido = saldo del motor', () => {
    const balances = calculateBalances(toBalanceInput(movements))
    for (const id of [A, B]) {
      const breakdown = balanceBreakdown(movements, id)
      expect(breakdown.balance).toBe(balances[id])
      expect(breakdown.paid - breakdown.share + breakdown.sent - breakdown.received).toBe(
        breakdown.balance,
      )
    }
  })

  it('suma solo lo activo y separa cada término', () => {
    expect(balanceBreakdown(movements, A)).toEqual({
      paid: 1_095_000,
      share: 648_950,
      sent: 0,
      received: 300_000,
      balance: 146_050,
    })
  })

  it('sin movimientos todo es cero', () => {
    expect(balanceBreakdown([], A)).toEqual({
      paid: 0,
      share: 0,
      sent: 0,
      received: 0,
      balance: 0,
    })
  })
})

describe('periodBridge', () => {
  const october = { from: '2026-10-01', to: '2026-10-31' }

  it('saldo anterior + efecto del mes = saldo al cierre', () => {
    const bridge = periodBridge(movements, A, october)
    expect(bridge).toEqual({
      before: 477_550,
      expenses: 28_500 - 60_000,
      transfers: -300_000,
      after: 146_050,
    })
  })

  it('el efecto de los gastos es lo que pagó menos su parte en el periodo', () => {
    const bridge = periodBridge(movements, A, october)
    const me = summarizePeriod(movements, [A, B], october).people.find((p) => p.userId === A)!
    expect(bridge.expenses).toBe(me.paid - me.share)
  })

  it('sin movimientos posteriores, el cierre coincide con el saldo total', () => {
    expect(periodBridge(movements, A, october).after).toBe(
      calculateBalances(toBalanceInput(movements))[A],
    )
  })

  it('ignora lo que pasa después del periodo', () => {
    const september = { from: '2026-09-01', to: '2026-09-30' }
    expect(periodBridge(movements, A, september)).toEqual({
      before: 0,
      expenses: 500_000 - 22_450,
      transfers: 0,
      after: 477_550,
    })
  })

  it('para el otro miembro todo es simétrico', () => {
    const a = periodBridge(movements, A, october)
    const b = periodBridge(movements, B, october)
    expect([b.before, b.expenses, b.transfers, b.after]).toEqual([
      -a.before,
      -a.expenses,
      -a.transfers,
      -a.after,
    ])
  })
})
