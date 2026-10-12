// Estadísticas por periodo (spec §17, §19, §20). TypeScript puro y determinista.
// Solo cuentan movimientos activos. Rangos de fechas inclusivos en formato 'YYYY-MM-DD'.

import type { Movement } from '../../types/domain'
import { addMonths, startOfMonth } from '../dates'

export interface DateRange {
  from: string
  to: string
}

export interface PersonSummary {
  userId: string
  /** Gastos que pagó (contribución, spec §20). */
  paid: number
  /** Lo que le correspondía de los gastos (su parte de los splits). */
  share: number
  /** Su parte de los ingresos (los compartidos cuentan según el reparto). */
  incomes: number
  transfersSent: number
  transfersReceived: number
}

export interface PeriodSummary {
  totalExpenses: number
  totalIncomes: number
  totalTransfers: number
  expenseCount: number
  people: PersonSummary[]
}

export const inRange = (date: string, range: DateRange) => date >= range.from && date <= range.to

function activeInRange(movements: ReadonlyArray<Movement>, range: DateRange) {
  return movements.filter(
    (movement) => movement.status === 'active' && inRange(movement.date, range),
  )
}

export function summarizePeriod(
  movements: ReadonlyArray<Movement>,
  memberIds: ReadonlyArray<string>,
  range: DateRange,
): PeriodSummary {
  const people = new Map<string, PersonSummary>()
  const person = (userId: string) => {
    let entry = people.get(userId)
    if (!entry) {
      entry = { userId, paid: 0, share: 0, incomes: 0, transfersSent: 0, transfersReceived: 0 }
      people.set(userId, entry)
    }
    return entry
  }
  for (const id of memberIds) person(id)

  const summary: PeriodSummary = {
    totalExpenses: 0,
    totalIncomes: 0,
    totalTransfers: 0,
    expenseCount: 0,
    people: [],
  }

  for (const movement of activeInRange(movements, range)) {
    switch (movement.kind) {
      case 'expense':
        summary.totalExpenses += movement.amount
        summary.expenseCount += 1
        person(movement.paidBy).paid += movement.amount
        for (const split of movement.splits) person(split.userId).share += split.amount
        break
      case 'income':
        summary.totalIncomes += movement.amount
        for (const split of movement.splits) person(split.userId).incomes += split.amount
        break
      case 'transfer':
        summary.totalTransfers += movement.amount
        person(movement.fromUser).transfersSent += movement.amount
        person(movement.toUser).transfersReceived += movement.amount
        break
    }
  }

  summary.people = [...people.values()]
  return summary
}

export interface CategoryTotal {
  categoryId: string | null
  amount: number
  /** Proporción en puntos básicos (10000 = 100 %); suman exactamente 10000. */
  shareBp: number
}

/** Reparte 10000 puntos básicos de forma proporcional y exacta (método del mayor resto). */
function proportionalBp(amounts: number[]): number[] {
  const total = amounts.reduce((sum, amount) => sum + amount, 0)
  if (total === 0) return amounts.map(() => 0)
  const raw = amounts.map((amount) => (amount * 10000) / total)
  const floors = raw.map(Math.floor)
  let leftover = 10000 - floors.reduce((sum, value) => sum + value, 0)
  const order = raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  for (const { index } of order) {
    if (leftover === 0) break
    floors[index] += 1
    leftover -= 1
  }
  return floors
}

/** Gasto por categoría en el periodo, de mayor a menor. */
export function expensesByCategory(
  movements: ReadonlyArray<Movement>,
  range: DateRange,
  options: { userId?: string } = {},
): CategoryTotal[] {
  const totals = new Map<string, number>()
  for (const movement of activeInRange(movements, range)) {
    if (movement.kind !== 'expense') continue
    const amount = options.userId
      ? (movement.splits.find((split) => split.userId === options.userId)?.amount ?? 0)
      : movement.amount
    if (amount === 0) continue
    totals.set(movement.categoryId, (totals.get(movement.categoryId) ?? 0) + amount)
  }
  const entries = [...totals.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
  const shares = proportionalBp(entries.map(([, amount]) => amount))
  return entries.map(([categoryId, amount], index) => ({
    categoryId,
    amount,
    shareBp: shares[index],
  }))
}

export interface MonthTotal {
  /** Primer día del mes, 'YYYY-MM-01'. */
  month: string
  total: number
  byPerson: Record<string, number>
}

/** Gasto pagado por mes (incluye meses sin gastos para que el gráfico no tenga huecos). */
export function monthlyExpenses(
  movements: ReadonlyArray<Movement>,
  range: DateRange,
  memberIds: ReadonlyArray<string>,
): MonthTotal[] {
  const months: MonthTotal[] = []
  for (let month = startOfMonth(range.from); month <= range.to; month = addMonths(month, 1)) {
    months.push({
      month,
      total: 0,
      byPerson: Object.fromEntries(memberIds.map((id) => [id, 0])),
    })
  }
  const index = new Map(months.map((entry, position) => [entry.month, position]))

  for (const movement of activeInRange(movements, range)) {
    if (movement.kind !== 'expense') continue
    const entry = months[index.get(startOfMonth(movement.date)) ?? -1]
    if (!entry) continue
    entry.total += movement.amount
    entry.byPerson[movement.paidBy] = (entry.byPerson[movement.paidBy] ?? 0) + movement.amount
  }
  return months
}
