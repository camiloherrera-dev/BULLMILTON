import { describe, expect, it } from 'vitest'
import type { Expense, Income, Movement, Transfer } from '../../types/domain'
import { expensesByCategory, monthlyExpenses, summarizePeriod } from './reports'

const A = 'a-user'
const B = 'b-user'
const audit = {
  createdBy: A,
  createdAt: '2026-10-01T00:00:00Z',
  updatedBy: A,
  updatedAt: '2026-10-01T00:00:00Z',
}

const expense = (
  date: string,
  paidBy: string,
  amount: number,
  categoryId: string,
  shares: [number, number],
  status: Expense['status'] = 'active',
): Expense => ({
  kind: 'expense',
  id: `${date}-${amount}`,
  description: 'x',
  amount,
  currency: 'COP',
  date,
  categoryId,
  paidBy,
  splitType: 'percentage',
  splits: [
    { userId: A, shareBp: 0, amount: shares[0] },
    { userId: B, shareBp: 0, amount: shares[1] },
  ],
  notes: null,
  status,
  recurringExpenseId: null,
  ...audit,
})

const income = (date: string, userId: string, amount: number): Income => ({
  kind: 'income',
  id: `i-${date}`,
  userId,
  source: 'x',
  amount,
  currency: 'COP',
  date,
  categoryId: null,
  notes: null,
  status: 'active',
  ...audit,
})

const transfer = (date: string, fromUser: string, toUser: string, amount: number): Transfer => ({
  kind: 'transfer',
  id: `t-${date}`,
  fromUser,
  toUser,
  amount,
  currency: 'COP',
  date,
  notes: null,
  status: 'active',
  ...audit,
})

const movements: Movement[] = [
  expense('2026-10-01', A, 1_000_000, 'vivienda', [500_000, 500_000]),
  expense('2026-10-03', A, 240_000, 'comida', [120_000, 120_000]),
  expense('2026-10-04', B, 120_000, 'transporte', [60_000, 60_000]),
  expense('2026-10-05', B, 50_000, 'comida', [25_000, 25_000], 'voided'),
  expense('2026-09-20', B, 80_000, 'comida', [40_000, 40_000]),
  income('2026-10-01', A, 3_200_000),
  transfer('2026-10-06', B, A, 300_000),
]

const october = { from: '2026-10-01', to: '2026-10-31' }

describe('summarizePeriod', () => {
  it('suma por persona lo pagado, su parte, ingresos y transferencias', () => {
    const summary = summarizePeriod(movements, [A, B], october)
    expect(summary.totalExpenses).toBe(1_360_000)
    expect(summary.expenseCount).toBe(3)
    expect(summary.totalIncomes).toBe(3_200_000)
    expect(summary.totalTransfers).toBe(300_000)
    expect(summary.people).toEqual([
      {
        userId: A,
        paid: 1_240_000,
        share: 680_000,
        incomes: 3_200_000,
        transfersSent: 0,
        transfersReceived: 300_000,
      },
      {
        userId: B,
        paid: 120_000,
        share: 680_000,
        incomes: 0,
        transfersSent: 300_000,
        transfersReceived: 0,
      },
    ])
  })

  it('la contribución total coincide con el total gastado', () => {
    const summary = summarizePeriod(movements, [A, B], october)
    const paid = summary.people.reduce((sum, person) => sum + person.paid, 0)
    const share = summary.people.reduce((sum, person) => sum + person.share, 0)
    expect(paid).toBe(summary.totalExpenses)
    expect(share).toBe(summary.totalExpenses)
  })
})

describe('expensesByCategory', () => {
  it('ordena de mayor a menor y los porcentajes suman exactamente 100 %', () => {
    const totals = expensesByCategory(movements, october)
    expect(totals.map((entry) => entry.categoryId)).toEqual(['vivienda', 'comida', 'transporte'])
    expect(totals.reduce((sum, entry) => sum + entry.shareBp, 0)).toBe(10000)
    expect(totals[0]).toEqual({ categoryId: 'vivienda', amount: 1_000_000, shareBp: 7353 })
  })

  it('puede calcular solo la parte de una persona', () => {
    const totals = expensesByCategory(movements, october, { userId: B })
    expect(totals.map((entry) => [entry.categoryId, entry.amount])).toEqual([
      ['vivienda', 500_000],
      ['comida', 120_000],
      ['transporte', 60_000],
    ])
  })

  it('sin gastos devuelve una lista vacía', () => {
    expect(expensesByCategory(movements, { from: '2020-01-01', to: '2020-01-31' })).toEqual([])
  })
})

describe('monthlyExpenses', () => {
  it('incluye meses vacíos y separa lo pagado por persona', () => {
    const months = monthlyExpenses(movements, { from: '2026-08-01', to: '2026-10-31' }, [A, B])
    expect(months).toEqual([
      { month: '2026-08-01', total: 0, byPerson: { [A]: 0, [B]: 0 } },
      { month: '2026-09-01', total: 80_000, byPerson: { [A]: 0, [B]: 80_000 } },
      { month: '2026-10-01', total: 1_360_000, byPerson: { [A]: 1_240_000, [B]: 120_000 } },
    ])
  })
})
