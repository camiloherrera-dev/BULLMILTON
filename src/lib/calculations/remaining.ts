// "Lo que queda" del periodo (decidido 2026-10-18). Reúsa summarizePeriod: el restante de cada
// persona es PersonSummary.left =
//   su parte de los ingresos − su parte de los gastos (según el split, no lo que pagó)
//   − transferencias enviadas + recibidas
// Los gastos con tarjeta cuentan al cargarse (como en Reportes) y los pagos de tarjeta no, así
// que no se cuentan dos veces. A diferencia del saldo disponible (available.ts), no arrastra
// meses anteriores. Las transferencias solo mueven el restante: no son gasto (spec §16).

import { endOfMonth, parseDay } from '../dates'
import type { PeriodSummary } from './reports'

/** Restante del hogar: la suma de los restantes de cada uno (las transferencias se anulan). */
export function householdRemaining(summary: PeriodSummary): number {
  return summary.people.reduce((sum, person) => sum + person.left, 0)
}

/** Días que faltan del mes contando hoy (hoy es el último día → 1). */
export function daysLeftInMonth(today: string): number {
  return parseDay(endOfMonth(today)).day - parseDay(today).day + 1
}

/**
 * Cuánto se puede gastar por día hasta fin de mes sin pasarse, redondeado hacia abajo a pesos.
 * 0 si no queda nada.
 */
export function dailyAllowance(remaining: number, today: string): number {
  if (remaining <= 0) return 0
  return Math.floor(remaining / daysLeftInMonth(today))
}
