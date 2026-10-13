// Saldo disponible de cada persona (decidido 2026-10-12): no hay deudas entre ustedes.
//   saldo = su parte de los ingresos − su parte de los gastos + transferencias recibidas − enviadas
// Quién pagó un gasto no importa: a cada uno se le descuenta su parte. Si el saldo de alguien
// queda negativo, está usando el saldo de los demás. TypeScript puro y determinista; solo cuentan
// movimientos activos y se acumula de un mes al siguiente.

import type { Movement } from '../../types/domain'
import type { LedgerDay } from './balance'
import { inRange, type DateRange } from './reports'

/** Cuánto cambia el saldo disponible de cada persona con un movimiento (vacío si está anulado). */
export function availableEffects(movement: Movement): Map<string, number> {
  const effects = new Map<string, number>()
  if (movement.status !== 'active') return effects
  const add = (userId: string, amount: number) =>
    effects.set(userId, (effects.get(userId) ?? 0) + amount)
  if (movement.kind === 'transfer') {
    add(movement.fromUser, -movement.amount)
    add(movement.toUser, movement.amount)
  } else {
    const sign = movement.kind === 'income' ? 1 : -1
    for (const split of movement.splits) add(split.userId, sign * split.amount)
  }
  return effects
}

export const availableEffect = (movement: Movement, userId: string) =>
  availableEffects(movement).get(userId) ?? 0

export interface AvailableSummary {
  userId: string
  /** Saldo con el que llegó al periodo (todo lo anterior a range.from). */
  carried: number
  /** Su parte de los ingresos del periodo. */
  incomes: number
  /** Su parte de los gastos del periodo, los pagara quien los pagara. */
  share: number
  received: number
  sent: number
  /** carried + incomes − share + received − sent. */
  balance: number
}

/** Saldo disponible de cada persona al cierre del periodo, con lo que pasó dentro de él. */
export function availableSummary(
  movements: ReadonlyArray<Movement>,
  memberIds: ReadonlyArray<string>,
  range: DateRange,
): AvailableSummary[] {
  const people = new Map<string, AvailableSummary>()
  const person = (userId: string) => {
    let entry = people.get(userId)
    if (!entry) {
      entry = { userId, carried: 0, incomes: 0, share: 0, received: 0, sent: 0, balance: 0 }
      people.set(userId, entry)
    }
    return entry
  }
  for (const id of memberIds) person(id)

  for (const movement of movements) {
    if (movement.status !== 'active' || movement.date > range.to) continue
    if (movement.date < range.from) {
      for (const [userId, effect] of availableEffects(movement)) person(userId).carried += effect
      continue
    }
    if (!inRange(movement.date, range)) continue
    if (movement.kind === 'transfer') {
      person(movement.fromUser).sent += movement.amount
      person(movement.toUser).received += movement.amount
    } else {
      for (const split of movement.splits) {
        if (movement.kind === 'income') person(split.userId).incomes += split.amount
        else person(split.userId).share += split.amount
      }
    }
  }

  for (const entry of people.values())
    entry.balance = entry.carried + entry.incomes - entry.share + entry.received - entry.sent
  return [...people.values()]
}

/**
 * Cuánto del saldo de otros está usando `userId`: lo que le falta (saldo negativo), hasta donde
 * alcance lo que les sobra a los demás. 0 si su saldo no es negativo.
 */
export function usingFromOthers(people: ReadonlyArray<AvailableSummary>, userId: string): number {
  const me = people.find((person) => person.userId === userId)
  if (!me || me.balance >= 0) return 0
  const spare = people
    .filter((person) => person.userId !== userId && person.balance > 0)
    .reduce((sum, person) => sum + person.balance, 0)
  return Math.min(-me.balance, spare)
}

/**
 * Libro diario con el saldo disponible de quien mira: días del más reciente al más antiguo, cada
 * uno con su saldo al cierre. Los movimientos deben venir del más reciente al más antiguo (como
 * los da el servicio). Mismo formato que buildLedger, para anotarlo con annotateLedger.
 */
export function buildAvailableLedger(
  movements: ReadonlyArray<Movement>,
  viewerId: string,
  options: { includeVoided?: boolean } = {},
): LedgerDay[] {
  let running = 0
  for (const movement of movements) running += availableEffect(movement, viewerId)

  const days: LedgerDay[] = []
  for (const movement of movements) {
    const effect = availableEffect(movement, viewerId)
    let day = days.at(-1)
    if (!day || day.date !== movement.date) {
      day = { date: movement.date, closingBalance: running, entries: [] }
      days.push(day)
    }
    running -= effect
    if (movement.status === 'active' || options.includeVoided)
      day.entries.push({ movement, effect })
  }
  return days.filter((day) => day.entries.length > 0)
}
