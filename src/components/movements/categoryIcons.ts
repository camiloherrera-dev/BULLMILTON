import type { ComponentType } from 'react'
import {
  BriefcaseIcon,
  BusIcon,
  CoinsIcon,
  DotsThreeOutlineIcon,
  FilmSlateIcon,
  ForkKnifeIcon,
  GraduationCapIcon,
  HeartbeatIcon,
  HouseLineIcon,
  LaptopIcon,
  MedalIcon,
  PiggyBankIcon,
  PlugIcon,
  RepeatIcon,
  ShoppingBagIcon,
  TagIcon,
  type IconProps,
} from '@phosphor-icons/react'

// Las categorías guardan una clave de icono (spec §30: categories.icon). Aquí se traduce a la
// familia de iconos de la app (Phosphor). Claves desconocidas usan una etiqueta genérica.
export const categoryIcons: Record<string, ComponentType<IconProps>> = {
  utensils: ForkKnifeIcon,
  home: HouseLineIcon,
  plug: PlugIcon,
  bus: BusIcon,
  film: FilmSlateIcon,
  'heart-pulse': HeartbeatIcon,
  'graduation-cap': GraduationCapIcon,
  repeat: RepeatIcon,
  'shopping-bag': ShoppingBagIcon,
  ellipsis: DotsThreeOutlineIcon,
  'piggy-bank': PiggyBankIcon,
  briefcase: BriefcaseIcon,
  laptop: LaptopIcon,
  award: MedalIcon,
  coins: CoinsIcon,
  tag: TagIcon,
}

export const iconChoices = Object.keys(categoryIcons)

/** Nombre legible de cada icono (lectores de pantalla). */
export const iconLabels: Record<string, string> = {
  utensils: 'Comida',
  home: 'Casa',
  plug: 'Servicios',
  bus: 'Transporte',
  film: 'Entretenimiento',
  'heart-pulse': 'Salud',
  'graduation-cap': 'Educación',
  repeat: 'Suscripción',
  'shopping-bag': 'Compras',
  ellipsis: 'Otros',
  'piggy-bank': 'Alcancía',
  briefcase: 'Trabajo',
  laptop: 'Computador',
  award: 'Medalla',
  coins: 'Monedas',
  tag: 'Etiqueta',
}
