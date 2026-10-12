import { useState } from 'react'
import {
  ArchiveIcon,
  ArrowCounterClockwiseIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import { useHousehold } from '../../app/household-context'
import { invalidateData } from '../../hooks/useResource'
import { toUserMessage } from '../../lib/errors'
import { createCategory, deleteCategory, updateCategory } from '../../services/household'
import type { Category, CategoryKind } from '../../types/domain'
import { CategoryIcon } from '../../components/movements/CategoryIcon'
import { iconChoices, iconLabels } from '../../components/movements/categoryIcons'
import { Button } from '../../components/ui/Button'
import { TextInput } from '../../components/ui/Field'
import { Page, PageHeader } from '../../components/ui/PageHeader'
import { Segmented } from '../../components/ui/Segmented'
import { useToast } from '../../components/ui/toast-context'

function IconChooser({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Icono</legend>
      <div className="flex flex-wrap gap-1.5">
        {iconChoices.map((icon) => (
          <label
            key={icon}
            className={`grid size-11 cursor-pointer place-items-center rounded-xl border has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${
              value === icon
                ? 'border-transparent bg-fg text-canvas'
                : 'border-transparent bg-surface-2 text-fg-muted hover:text-fg'
            }`}
          >
            <input
              type="radio"
              name="icon"
              value={icon}
              checked={value === icon}
              onChange={() => onChange(icon)}
              className="sr-only"
              aria-label={iconLabels[icon] ?? icon}
            />
            <CategoryIcon icon={icon} />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function CategoryRow({ category }: { category: Category }) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [icon, setIcon] = useState(category.icon ?? 'tag')
  const [busy, setBusy] = useState(false)

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true)
    try {
      await action()
      invalidateData()
      toast.show(success)
      setEditing(false)
    } catch (error) {
      toast.show(toUserMessage(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  if (editing)
    return (
      <li className="flex flex-col gap-3 py-4">
        <label htmlFor={`name-${category.id}`} className="text-sm font-medium">
          Nombre
        </label>
        <TextInput
          id={`name-${category.id}`}
          value={name}
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
        />
        <IconChooser value={icon} onChange={setIcon} />
        <div className="flex gap-2">
          <Button
            size="sm"
            loading={busy}
            disabled={!name.trim()}
            onClick={() =>
              run(() => updateCategory(category.id, { name, icon }), 'Categoría actualizada')
            }
          >
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      </li>
    )

  return (
    <li className={`flex items-center gap-3 py-2.5 ${category.archivedAt ? 'opacity-60' : ''}`}>
      <span className="grid size-10 place-items-center rounded-full bg-surface-2">
        <CategoryIcon icon={category.icon} />
      </span>
      <span className="flex-1 font-medium">
        {category.name}
        {category.archivedAt && (
          <span className="ml-2 text-sm font-normal text-fg-muted">Archivada</span>
        )}
      </span>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Editar ${category.name}`}
        onClick={() => setEditing(true)}
        icon={<PencilSimpleIcon aria-hidden="true" className="size-4" />}
      />
      {category.archivedAt ? (
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Restaurar ${category.name}`}
          disabled={busy}
          onClick={() =>
            run(() => updateCategory(category.id, { archived: false }), 'Categoría restaurada')
          }
          icon={<ArrowCounterClockwiseIcon aria-hidden="true" className="size-4" />}
        />
      ) : (
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Archivar ${category.name}`}
          disabled={busy}
          onClick={() =>
            run(() => updateCategory(category.id, { archived: true }), 'Categoría archivada')
          }
          icon={<ArchiveIcon aria-hidden="true" className="size-4" />}
        />
      )}
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Borrar ${category.name}`}
        disabled={busy}
        onClick={() => run(() => deleteCategory(category.id), 'Categoría borrada')}
        icon={<TrashIcon aria-hidden="true" className="size-4" />}
      />
    </li>
  )
}

/** Categorías personalizadas (spec §13, P1). Las que tienen movimientos se archivan, no se borran. */
export function CategoriesPage() {
  const data = useHousehold()
  const toast = useToast()
  const [kind, setKind] = useState<CategoryKind>('expense')
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('tag')
  const [busy, setBusy] = useState(false)
  const list = data.categories.filter((category) => category.kind === kind)

  const add = async () => {
    setBusy(true)
    try {
      await createCategory(data.household.id, kind, name, icon)
      invalidateData()
      setName('')
      toast.show('Categoría creada')
    } catch (error) {
      toast.show(toUserMessage(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page>
      <PageHeader
        title="Categorías"
        back="/ajustes"
        description="Las que ya tienen movimientos no se pueden borrar: archívalas para ocultarlas."
      />
      <div className="flex flex-col gap-6">
        <Segmented<CategoryKind>
          label="Tipo"
          hideLabel
          value={kind}
          onChange={setKind}
          options={[
            { value: 'expense', label: 'De gasto' },
            { value: 'income', label: 'De ingreso' },
          ]}
        />
        <ul className="divide-y divide-line">
          {list.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </ul>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (name.trim()) void add()
          }}
          className="flex flex-col gap-4 rounded-2xl bg-surface p-4"
        >
          <h2 className="font-semibold">
            Nueva categoría {kind === 'expense' ? 'de gasto' : 'de ingreso'}
          </h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-category" className="text-sm font-medium">
              Nombre
            </label>
            <TextInput
              id="new-category"
              value={name}
              maxLength={40}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <IconChooser value={icon} onChange={setIcon} />
          <Button type="submit" className="self-start" loading={busy} disabled={!name.trim()}>
            Crear categoría
          </Button>
        </form>
      </div>
    </Page>
  )
}
