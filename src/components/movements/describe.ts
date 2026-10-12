import { memberName, nameInSentence, type HouseholdData } from '../../app/household-context'
import { formatShare } from '../../lib/money'
import type { Expense, Income, Movement } from '../../types/domain'

// Textos de presentación de un movimiento (no son cálculos financieros: el efecto en el saldo
// lo da el motor de balance).

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

/** Línea secundaria: quién pagó / recibió y cómo se dividió. */
export function movementDetail(movement: Movement, data: HouseholdData): string {
  switch (movement.kind) {
    case 'expense': {
      const payer =
        movement.paidBy === data.userId ? 'Pagaste' : `Pagó ${memberName(data, movement.paidBy)}`
      return `${payer} · ${splitLabel(movement, data)}`
    }
    case 'income': {
      const receiver =
        movement.userId === data.userId
          ? 'Recibiste'
          : `Recibió ${nameInSentence(data, movement.userId)}`
      if (movement.splits.length > 1)
        return `${receiver} · compartido ${splitLabel(movement, data)}`
      const owner = movement.splits[0]?.userId ?? movement.userId
      if (owner === movement.userId)
        return owner === data.userId ? 'Tu ingreso' : `Ingreso de ${memberName(data, owner)}`
      return `${receiver} · ${splitLabel(movement, data)}`
    }
    case 'transfer': {
      const from = memberName(data, movement.fromUser, { you: true })
      const to = movement.toUser === data.userId ? 'ti' : nameInSentence(data, movement.toUser)
      return `${from} → ${to}`
    }
  }
}
