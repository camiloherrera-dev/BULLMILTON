// Lecturas del saldo para explicarlo en pantalla (spec §9-§11). TypeScript puro y determinista.
// Se apoya en el motor de balance (balance.ts) sin cambiarlo: misma convención de signo,
//   saldo > 0 → le deben a quien mira · saldo < 0 → quien mira debe.

import type { Movement } from '../../types/domain'
import { movementEffect, type LedgerDay, type LedgerEntry } from './balance'
import { inRange, type DateRange } from './reports'

export interface AnnotatedEntry extends LedgerEntry {
  /** Saldo de quien mira justo antes de este movimiento. */
  before: number
  /** Saldo de quien mira justo después (before + effect). */
  after: number
}

export interface AnnotatedDay extends Omit<LedgerDay, 'entries'> {
  entries: AnnotatedEntry[]
}

/**
 * Añade a cada fila del libro el saldo antes y después de ese movimiento. Los días vienen de
 * `buildLedger` (más reciente primero, entradas en el mismo orden) y deben estar completos:
 * hay que anotar ANTES de filtrar filas, o los saldos intermedios saldrían mal.
 */
export function annotateLedger(days: ReadonlyArray<LedgerDay>): AnnotatedDay[] {
  return days.map((day) => {
    let after = day.closingBalance
    const entries = day.entries.map((entry) => {
      const annotated = { ...entry, before: after - entry.effect, after }
      after -= entry.effect
      return annotated
    })
    return { ...day, entries }
  })
}

/** Recorta el libro a las `max` filas más recientes (el último día puede quedar parcial). */
export function limitEntries<Day extends { entries: ReadonlyArray<unknown> }>(
  days: ReadonlyArray<Day>,
  max: number,
): Day[] {
  const result: Day[] = []
  let left = max
  for (const day of days) {
    if (left <= 0) break
    const entries = day.entries.slice(0, left)
    result.push({ ...day, entries })
    left -= entries.length
  }
  return result
}

export interface BalanceBreakdown {
  /** Total de los gastos que pagó. */
  paid: number
  /** Lo que le correspondía de los gastos (su parte de los splits). */
  share: number
  /** Transferencias que envió. */
  sent: number
  /** Transferencias que recibió. */
  received: number
  /** paid − share + sent − received; coincide con calculateBalances. */
  balance: number
}

/** Desglose del saldo de una persona con todo el historial activo ("¿Cómo se calcula?"). */
export function balanceBreakdown(
  movements: ReadonlyArray<Movement>,
  userId: string,
): BalanceBreakdown {
  const result = { paid: 0, share: 0, sent: 0, received: 0, balance: 0 }
  for (const movement of movements) {
    if (movement.status !== 'active') continue
    if (movement.kind === 'expense') {
      if (movement.paidBy === userId) result.paid += movement.amount
      for (const split of movement.splits) if (split.userId === userId) result.share += split.amount
    } else if (movement.kind === 'transfer') {
      if (movement.fromUser === userId) result.sent += movement.amount
      if (movement.toUser === userId) result.received += movement.amount
    }
  }
  result.balance = result.paid - result.share + result.sent - result.received
  return result
}

export interface PeriodBridge {
  /** Saldo de quien mira antes de que empiece el periodo. */
  before: number
  /** Efecto de los gastos del periodo: lo que pagó menos su parte. */
  expenses: number
  /** Efecto de las transferencias del periodo: enviadas menos recibidas. */
  transfers: number
  /** Saldo al cerrar el periodo: before + expenses + transfers. */
  after: number
}

/** Cómo pasa el saldo de quien mira de antes del periodo a su cierre (tarjeta del mes). */
export function periodBridge(
  movements: ReadonlyArray<Movement>,
  userId: string,
  range: DateRange,
): PeriodBridge {
  const bridge = { before: 0, expenses: 0, transfers: 0, after: 0 }
  for (const movement of movements) {
    const effect = movementEffect(movement, userId)
    if (effect === 0) continue
    if (movement.date < range.from) bridge.before += effect
    else if (inRange(movement.date, range)) {
      if (movement.kind === 'expense') bridge.expenses += effect
      else bridge.transfers += effect
    }
  }
  bridge.after = bridge.before + bridge.expenses + bridge.transfers
  return bridge
}
