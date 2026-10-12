import { memberName, nameInSentence, type HouseholdData } from '../../app/household-context'
import { formatMoney, formatShare } from '../../lib/money'
import type { Expense, Income, Movement, Transfer } from '../../types/domain'

// Textos de presentación de un movimiento (no son cálculos financieros: el efecto en el saldo y
// los saldos antes/después los da lib/calculations; aquí solo se eligen las palabras).

export function movementTitle(movement: Movement): string {
  switch (movement.kind) {
    case 'expense':
      return movement.description
    case 'income':
      return movement.source
    case 'transfer':
      return movement.notes?.trim() || 'Transferencia'
  }
}

export function movementPath(movement: Movement): string {
  const base = { expense: '/gastos', income: '/ingresos', transfer: '/transferencias' }[
    movement.kind
  ]
  return `${base}/${movement.id}`
}

/** "50/50", "70/30" o "33,33 % / 66,67 %" según la división (en el orden de los miembros). */
export function splitLabel(movement: Expense | Income, data: HouseholdData): string {
  const ordered = [...movement.splits].sort((a, b) => {
    const position = (id: string) => data.members.findIndex((member) => member.userId === id)
    return position(a.userId) - position(b.userId)
  })
  if (ordered.length === 1) {
    return ordered[0].userId === data.userId
      ? 'todo tuyo'
      : `todo de ${memberName(data, ordered[0].userId)}`
  }
  if (ordered.length === 2 && ordered.every((split) => split.shareBp % 100 === 0)) {
    return ordered.map((split) => split.shareBp / 100).join('/')
  }
  if (movement.splitType === 'equal') return 'partes iguales'
  return ordered.map((split) => formatShare(split.shareBp)).join(' / ')
}

/** "Sebastián te pasó dinero" / "Le pasaste dinero a Sebastián" / "Ana le pasó dinero a Beto". */
export function transferSentence(transfer: Transfer, data: HouseholdData): string {
  if (transfer.toUser === data.userId)
    return `${memberName(data, transfer.fromUser)} te pasó dinero`
  if (transfer.fromUser === data.userId)
    return `Le pasaste dinero a ${memberName(data, transfer.toUser)}`
  return `${memberName(data, transfer.fromUser)} le pasó dinero a ${memberName(data, transfer.toUser)}`
}

/** Línea secundaria: quién pagó / recibió y cómo se dividió. */
export function movementDetail(movement: Movement, data: HouseholdData): string {
  switch (movement.kind) {
    case 'expense': {
      const payer =
        movement.paidBy === data.userId ? 'Pagaste' : `Pagó ${memberName(data, movement.paidBy)}`
      const split = splitLabel(movement, data)
      const mine = movement.splits.find((item) => item.userId === data.userId)?.amount ?? 0
      // Tu parte es lo que descuenta de lo que te queda este mes.
      if (split === 'todo tuyo' || mine === 0) return `${payer} · ${split}`
      return `${payer} · ${split} · tu parte ${formatMoney(mine)}`
    }
    case 'income': {
      const receiver =
        movement.userId === data.userId
          ? 'Recibiste'
          : `Recibió ${nameInSentence(data, movement.userId)}`
      if (movement.splits.length > 1) {
        const mine = movement.splits.find((item) => item.userId === data.userId)?.amount ?? 0
        const part = mine > 0 ? ` · para ti ${formatMoney(mine)}` : ''
        return `${receiver} · compartido ${splitLabel(movement, data)}${part}`
      }
      const owner = movement.splits[0]?.userId ?? movement.userId
      if (owner === movement.userId)
        return owner === data.userId ? 'Tu ingreso' : `Ingreso de ${memberName(data, owner)}`
      return `${receiver} · ${splitLabel(movement, data)}`
    }
    case 'transfer':
      return movement.notes?.trim() ? 'Transferencia' : 'Transferencia entre ustedes'
  }
}

/** El otro miembro del hogar, si hay exactamente uno (el caso normal: dos hermanos). */
function otherName(data: HouseholdData): string | null {
  const others = data.members.filter((member) => member.userId !== data.userId)
  return others.length === 1 ? others[0].displayName : null
}

/** "Sebastián te debe" / "Te deben" (si el hogar no es de dos). */
function owesYou(data: HouseholdData, tense: 'now' | 'past' = 'now') {
  const other = otherName(data)
  const verb = tense === 'now' ? 'debe' : 'debía'
  return other ? `${other} te ${verb}` : `Te ${tense === 'now' ? 'deben' : 'debían'}`
}

/** "Le debes" / "Debes". */
function youOwe(data: HouseholdData, tense: 'now' | 'past' = 'now') {
  const verb = tense === 'now' ? 'debes' : 'debías'
  return otherName(data) ? `Le ${verb}` : verb[0].toUpperCase() + verb.slice(1)
}

export interface BalancePhrase {
  /** "Sebastián te debía", "Le debes", "Estaban a mano". */
  lead: string
  /** Monto en positivo, o null si están a mano. */
  amount: number | null
  tone: 'positive' | 'negative' | 'neutral'
}

/** Un saldo de quien mira dicho en palabras (encabezados del libro, tarjeta del mes). */
export function balancePhrase(
  balance: number,
  data: HouseholdData,
  tense: 'now' | 'past' = 'now',
): BalancePhrase {
  if (balance > 0) return { lead: owesYou(data, tense), amount: balance, tone: 'positive' }
  if (balance < 0) return { lead: youOwe(data, tense), amount: -balance, tone: 'negative' }
  return {
    lead: tense === 'now' ? 'Están a mano' : 'Estaban a mano',
    amount: null,
    tone: 'neutral',
  }
}

export interface EffectText {
  text: string
  /** Verde: te deben más. Rojo: debes más. Neutro: se acercan a cero o no cambia. */
  tone: 'positive' | 'negative' | 'neutral'
}

/**
 * Qué le hizo un movimiento al saldo de quien mira, en una frase. `before`/`after` vienen de
 * annotateLedger y `effect` del motor de balance; aquí solo se elige cómo decirlo.
 */
export function effectText(
  movement: Movement,
  effect: number,
  before: number,
  after: number,
  data: HouseholdData,
): EffectText | null {
  if (movement.status === 'voided') return { text: 'Anulado: no cuenta', tone: 'neutral' }
  if (movement.kind === 'income') return null
  if (effect === 0) {
    const mineOnly =
      movement.kind === 'expense' &&
      movement.paidBy === data.userId &&
      movement.splits.every((split) => split.userId === data.userId)
    return { text: mineOnly ? 'Solo tuyo: no cambia el saldo' : 'No te afecta', tone: 'neutral' }
  }

  const amount = formatMoney(Math.abs(effect))
  const evenNow = after === 0
  const crossed = (before > 0 && after < 0) || (before < 0 && after > 0)
  const towardZero = Math.abs(after) < Math.abs(before) && !crossed
  // Cómo queda el saldo, para usar a mitad de frase ("…: Sebastián te debe $10.000").
  const rest = () => {
    const phrase = balancePhrase(after, data)
    const lead = otherName(data) && after > 0 ? phrase.lead : lowerFirst(phrase.lead)
    return `${lead} ${formatMoney(phrase.amount ?? 0)}`
  }
  const restTone = after > 0 ? 'positive' : 'negative'

  if (movement.kind === 'transfer') {
    const settled = effect < 0 ? 'Saldó' : 'Saldaste' // effect < 0: quien mira recibió el dinero
    if (evenNow) return { text: `${settled} la deuda: quedaron a mano`, tone: 'neutral' }
    if (towardZero) return { text: `${settled} parte de la deuda: ${rest()}`, tone: 'neutral' }
    if (crossed)
      return effect < 0
        ? { text: `Te pagó de más: ahora ${rest()}`, tone: restTone }
        : { text: `Le pagaste de más: ahora ${rest()}`, tone: restTone }
    // Se aleja de cero: es un préstamo, no un abono.
    return effect < 0
      ? { text: `Ahora ${lowerFirst(youOwe(data))} ${amount} más`, tone: 'negative' }
      : { text: `Ahora ${owesYouInSentence(data)} ${amount} más`, tone: 'positive' }
  }

  // Gasto.
  if (evenNow) return { text: 'Con esto quedan a mano', tone: 'neutral' }
  if (crossed) return { text: `Quedan a mano y ahora ${rest()}`, tone: restTone }
  if (towardZero)
    return effect > 0
      ? { text: `${youOwe(data)} ${amount} menos`, tone: 'neutral' }
      : { text: `${owesYou(data)} ${amount} menos`, tone: 'neutral' }
  return effect > 0
    ? { text: `${owesYou(data)} ${amount} más`, tone: 'positive' }
    : { text: `${youOwe(data)} ${amount} más`, tone: 'negative' }
}

const lowerFirst = (text: string) => text[0].toLowerCase() + text.slice(1)

/** "Sebastián te debe" a mitad de frase (el nombre conserva su mayúscula). */
const owesYouInSentence = (data: HouseholdData) =>
  otherName(data) ? owesYou(data) : lowerFirst(owesYou(data))
