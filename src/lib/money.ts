// Dinero: siempre enteros en la unidad mínima (COP sin decimales). Nunca float.

const plainFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

/** 1000000 → "1.000.000" (sin símbolo, para columnas). */
export function formatAmount(amount: number): string {
  return plainFormatter.format(amount)
}

/** 1000000 → "$1.000.000". Negativos: "−$1.000". */
export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '−' : ''
  return `${sign}$${formatAmount(Math.abs(amount))}`
}

/** Efecto en un saldo: "+$66.500" / "−$22.450" / "$0" (signo menos tipográfico). */
export function formatSigned(amount: number): string {
  if (amount === 0) return '$0'
  const sign = amount > 0 ? '+' : '−'
  return `${sign}$${formatAmount(Math.abs(amount))}`
}

export const MAX_AMOUNT = 100_000_000_000_000

/**
 * Convierte lo que escribe la persona ("1.000.000", "$ 45 000", "45000") a entero.
 * Devuelve null si no es un monto entero positivo válido. No acepta decimales:
 * en COP el punto y la coma son separadores de miles.
 */
export function parseMoneyInput(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null
  const value = Number(digits)
  if (!Number.isSafeInteger(value) || value <= 0 || value > MAX_AMOUNT) return null
  return value
}

/** Formato mientras se escribe: "1000000" → "1.000.000". */
export function formatMoneyInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Puntos básicos → "33,33 %". */
export function formatShare(shareBp: number): string {
  return `${(shareBp / 100).toLocaleString('es-CO', { maximumFractionDigits: 2 })} %`
}

/** "33,33" o "33.33" → 3333 puntos básicos; null si no es un porcentaje válido (0-100, 2 decimales). */
export function parsePercentToBp(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalized)) return null
  const [whole, fraction = ''] = normalized.split('.')
  const bp = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return bp <= 10000 ? bp : null
}
