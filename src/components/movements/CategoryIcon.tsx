import { ArrowsLeftRightIcon, TagIcon } from '@phosphor-icons/react'
import { categoryIcons } from './categoryIcons'

export function CategoryIcon({
  icon,
  className = 'size-5',
}: {
  icon: string | null | undefined
  className?: string
}) {
  const Icon = (icon && categoryIcons[icon]) || TagIcon
  return <Icon aria-hidden="true" className={className} />
}

export function TransferIcon({ className = 'size-5' }: { className?: string }) {
  return <ArrowsLeftRightIcon aria-hidden="true" className={className} />
}
