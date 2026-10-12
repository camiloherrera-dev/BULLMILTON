import { createContext, useContext } from 'react'
import type { Category, Household, Member, Movement } from '../types/domain'

export interface HouseholdData {
  userId: string
  household: Household
  members: Member[]
  /** Yo, dentro de members. */
  me: Member
  categories: Category[]
  movements: Movement[]
  /** Movimientos recargándose en segundo plano. */
  refreshing: boolean
}

export const HouseholdContext = createContext<HouseholdData | null>(null)

/** Datos del household activo. Solo dentro de las rutas que exigen household. */
export function useHousehold(): HouseholdData {
  const value = useContext(HouseholdContext)
  if (!value) throw new Error('useHousehold fuera de HouseholdProvider')
  return value
}

/** Nombre para usar dentro de una frase: "tú" para quien mira, el nombre tal cual para los demás. */
export function nameInSentence(data: HouseholdData, userId: string) {
  return userId === data.userId ? 'tú' : memberName(data, userId)
}

/** Nombre visible de un miembro ("tú" para quien mira si se pide). */
export function memberName(data: HouseholdData, userId: string, options?: { you?: boolean }) {
  if (options?.you && userId === data.userId) return 'Tú'
  return data.members.find((member) => member.userId === userId)?.displayName ?? 'Alguien'
}
