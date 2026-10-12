import { z } from 'zod'
import { isValidDay } from '../dates'
import { parseMoneyInput, parsePercentToBp } from '../money'

// Esquemas Zod de los formularios (spec §35). La base de datos sigue siendo la autoridad; esto
// es para dar errores claros antes de enviar.

export const moneyField = z
  .string()
  .refine((value) => parseMoneyInput(value) !== null, 'Escribe un monto mayor que cero.')

export const dayField = z.string().refine(isValidDay, 'Elige una fecha válida.')

export const notesField = z.string().max(500, 'Máximo 500 caracteres.')

export const splitFields = {
  splitType: z.enum(['equal', 'percentage']),
  participants: z.array(z.string()),
  percents: z.record(z.string(), z.string()),
}

/** Valida la división: al menos una persona (iguales) o porcentajes que suman 100 %. */
export function refineSplit(
  value: {
    splitType: 'equal' | 'percentage'
    participants: string[]
    percents: Record<string, string>
  },
  context: z.RefinementCtx,
) {
  if (value.splitType === 'equal') {
    if (value.participants.length === 0)
      context.addIssue({
        code: 'custom',
        path: ['participants'],
        message: 'Elige al menos una persona.',
      })
    return
  }
  let total = 0
  for (const [userId, raw] of Object.entries(value.percents)) {
    const bp = parsePercentToBp(raw === '' ? '0' : raw)
    if (bp === null) {
      context.addIssue({
        code: 'custom',
        path: ['percents', userId],
        message: 'Usa un número entre 0 y 100 (hasta dos decimales).',
      })
      return
    }
    total += bp
  }
  if (total !== 10000)
    context.addIssue({
      code: 'custom',
      path: ['percents'],
      message: `Los porcentajes deben sumar 100 % (ahora suman ${(total / 100).toLocaleString('es-CO')} %).`,
    })
}

export const expenseSchema = z
  .object({
    description: z.string().trim().min(1, 'Escribe qué fue.').max(120, 'Máximo 120 caracteres.'),
    amount: moneyField,
    date: dayField,
    categoryId: z.string().min(1, 'Elige una categoría.'),
    paidBy: z.string().min(1, 'Elige quién pagó.'),
    notes: notesField,
    ...splitFields,
  })
  .superRefine(refineSplit)

export type ExpenseFormValues = z.infer<typeof expenseSchema>

export const incomeSchema = z.object({
  source: z.string().trim().min(1, 'Escribe de dónde viene.').max(120, 'Máximo 120 caracteres.'),
  amount: moneyField,
  date: dayField,
  categoryId: z.string(),
  notes: notesField,
})

export type IncomeFormValues = z.infer<typeof incomeSchema>

export const transferSchema = z
  .object({
    fromUser: z.string().min(1, 'Elige quién envía.'),
    toUser: z.string().min(1, 'Elige quién recibe.'),
    amount: moneyField,
    date: dayField,
    notes: notesField,
  })
  .refine((value) => value.fromUser !== value.toUser, {
    path: ['toUser'],
    message: 'Quien envía y quien recibe deben ser personas distintas.',
  })

export type TransferFormValues = z.infer<typeof transferSchema>

export const recurringSchema = z
  .object({
    name: z.string().trim().min(1, 'Ponle un nombre.').max(120, 'Máximo 120 caracteres.'),
    amount: moneyField,
    frequency: z.enum(['monthly', 'quarterly']),
    nextDueDate: dayField,
    categoryId: z.string().min(1, 'Elige una categoría.'),
    paidBy: z.string().min(1, 'Elige quién paga normalmente.'),
    notes: notesField,
    active: z.boolean(),
    ...splitFields,
  })
  .superRefine(refineSplit)

export type RecurringFormValues = z.infer<typeof recurringSchema>
