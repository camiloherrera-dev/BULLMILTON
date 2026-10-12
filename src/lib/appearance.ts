// Apariencia (Ajustes → Apariencia): tema de color y tipografía de cada cuenta.
// Los colores viven en src/styles/tokens.css; aquí solo están los ids, nombres y cómo aplicarlos.
// Los ids deben coincidir con el check de profiles.theme / profiles.font en la base de datos.

export const themes = [
  {
    id: 'bullmilton',
    name: 'Bullmilton',
    detail: 'Azul noche y amarillo. El original.',
    mode: 'dark',
  },
  { id: 'grafito', name: 'Grafito', detail: 'Gris neutro con naranja.', mode: 'dark' },
  { id: 'oceano', name: 'Océano', detail: 'Azul profundo con celeste.', mode: 'dark' },
  { id: 'vino', name: 'Vino', detail: 'Borgoña con durazno.', mode: 'dark' },
  { id: 'papel', name: 'Papel', detail: 'Crema cálido con ámbar.', mode: 'light' },
  { id: 'salvia', name: 'Salvia', detail: 'Verde claro con azul.', mode: 'light' },
] as const

export const fonts = [
  { id: 'system', name: 'Del sistema', detail: 'La de tu teléfono o computador.' },
  { id: 'geist', name: 'Geist', detail: 'Moderna y precisa.' },
  { id: 'manrope', name: 'Manrope', detail: 'Redondeada y cercana.' },
  { id: 'plex', name: 'IBM Plex Sans', detail: 'Técnica, con carácter.' },
  { id: 'atkinson', name: 'Atkinson Hyperlegible', detail: 'Pensada para leer sin esfuerzo.' },
] as const

export type ThemeId = (typeof themes)[number]['id']
export type FontId = (typeof fonts)[number]['id']

export interface Appearance {
  theme: ThemeId
  font: FontId
}

export const defaultAppearance: Appearance = { theme: 'bullmilton', font: 'system' }

const STORAGE_KEY = 'bullmilton.appearance'

const isTheme = (value: unknown): value is ThemeId => themes.some((theme) => theme.id === value)
const isFont = (value: unknown): value is FontId => fonts.some((font) => font.id === value)

/** Normaliza lo que venga de la base de datos o del navegador (valores desconocidos → defecto). */
export function toAppearance(value: { theme?: unknown; font?: unknown } | null): Appearance {
  return {
    theme: isTheme(value?.theme) ? value.theme : defaultAppearance.theme,
    font: isFont(value?.font) ? value.font : defaultAppearance.font,
  }
}

/** Aplica el tema y la fuente al documento y los recuerda en este navegador. */
export function applyAppearance(appearance: Appearance) {
  const root = document.documentElement
  if (appearance.theme === defaultAppearance.theme) delete root.dataset.theme
  else root.dataset.theme = appearance.theme
  if (appearance.font === defaultAppearance.font) delete root.dataset.font
  else root.dataset.font = appearance.font

  // Barra del navegador en el móvil con el color de fondo del tema.
  const canvas = getComputedStyle(root).getPropertyValue('--color-canvas').trim()
  if (canvas) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', canvas)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance))
  } catch {
    // Sin almacenamiento (modo privado): se aplica igual, solo no se recuerda en este navegador.
  }
}

/** Lo último usado en este navegador, para pintar el tema correcto antes de cargar la cuenta. */
export function cachedAppearance(): Appearance {
  try {
    return toAppearance(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
  } catch {
    return defaultAppearance
  }
}

export function currentAppearance(): Appearance {
  const root = document.documentElement
  return toAppearance({
    theme: root.dataset.theme ?? defaultAppearance.theme,
    font: root.dataset.font ?? defaultAppearance.font,
  })
}
