import { useId, useRef, useState, type ReactNode } from 'react'
import { CheckCircleIcon } from '@phosphor-icons/react'
import { useSignedInUser } from '../../app/auth-context'
import {
  applyAppearance,
  currentAppearance,
  fonts,
  themes,
  type Appearance,
} from '../../lib/appearance'
import { toUserMessage } from '../../lib/errors'
import { updateAppearance } from '../../services/household'
import { Page, PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/toast-context'

/** Opción de radio en forma de tarjeta; la marca de seleccionado no depende solo del color. */
function OptionCard({
  name,
  checked,
  onSelect,
  preview,
  title,
  detail,
}: {
  name: string
  checked: boolean
  onSelect: () => void
  preview: ReactNode
  title: string
  detail: string
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 bg-surface transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
        checked ? 'border-fg' : 'border-transparent hover:border-line-strong'
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="sr-only" />
      {preview}
      <span className="flex items-start gap-2 px-3.5 py-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{title}</span>
          <span className="text-sm text-fg-muted">{detail}</span>
        </span>
        {checked && (
          <CheckCircleIcon aria-hidden="true" className="size-6 shrink-0 text-fg" weight="fill" />
        )}
      </span>
    </label>
  )
}

/** Miniatura del tema: se pinta con sus propios tokens gracias a data-theme. */
function ThemePreview({ id }: { id: string }) {
  return (
    <span data-theme={id} aria-hidden="true" className="flex flex-col gap-2 bg-canvas p-3.5">
      <span className="text-xs text-fg-muted">Te deben</span>
      <span className="tabular text-xl leading-none font-semibold text-fg">$ 266.050</span>
      <span className="flex items-center gap-1.5">
        <span className="inline-flex h-7 items-center rounded-lg bg-primary px-2.5 text-xs font-semibold text-on-primary">
          + Gasto
        </span>
        <span className="inline-flex h-7 items-center rounded-lg bg-surface px-2 tabular text-xs font-semibold text-positive">
          +20.000
        </span>
        <span className="inline-flex h-7 items-center rounded-lg bg-surface px-2 tabular text-xs font-semibold text-negative">
          −8.500
        </span>
      </span>
    </span>
  )
}

function FontPreview({ id }: { id: string }) {
  return (
    <span
      data-font={id}
      aria-hidden="true"
      className="flex flex-col gap-0.5 bg-surface-2 px-3.5 py-3 font-sans"
    >
      <span className="tabular text-2xl leading-tight font-semibold">$ 1.234.567</span>
      <span className="text-sm text-fg-muted">Mercado del sábado</span>
    </span>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function AppearancePage() {
  const { userId } = useSignedInUser()
  const toast = useToast()
  const [appearance, setAppearance] = useState<Appearance>(currentAppearance)
  // Último valor confirmado por la base de datos, para volver a él si falla el guardado.
  const saved = useRef(appearance)
  const name = useId()

  const choose = async (next: Appearance) => {
    // Se aplica al instante; se guarda en la cuenta para el resto de dispositivos.
    setAppearance(next)
    applyAppearance(next)
    try {
      await updateAppearance(userId, next)
      saved.current = next
    } catch (error) {
      setAppearance(saved.current)
      applyAppearance(saved.current)
      toast.show(
        toUserMessage(error, 'No pudimos guardar la apariencia. Inténtalo de nuevo.'),
        'error',
      )
    }
  }

  return (
    <Page>
      <PageHeader
        title="Apariencia"
        back="/ajustes"
        description="Se guarda en tu cuenta: la verás igual en el celular y en el computador."
      />
      <div className="flex flex-col gap-8">
        <Group title="Tema">
          <fieldset>
            <legend className="sr-only">Tema</legend>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
              {themes.map((theme) => (
                <OptionCard
                  key={theme.id}
                  name={`${name}-theme`}
                  checked={appearance.theme === theme.id}
                  onSelect={() => choose({ ...appearance, theme: theme.id })}
                  preview={<ThemePreview id={theme.id} />}
                  title={theme.name}
                  detail={`${theme.mode === 'dark' ? 'Oscuro' : 'Claro'}. ${theme.detail}`}
                />
              ))}
            </div>
          </fieldset>
        </Group>

        <Group title="Tipografía">
          <fieldset>
            <legend className="sr-only">Tipografía</legend>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
              {fonts.map((font) => (
                <OptionCard
                  key={font.id}
                  name={`${name}-font`}
                  checked={appearance.font === font.id}
                  onSelect={() => choose({ ...appearance, font: font.id })}
                  preview={<FontPreview id={font.id} />}
                  title={font.name}
                  detail={font.detail}
                />
              ))}
            </div>
          </fieldset>
        </Group>
      </div>
    </Page>
  )
}
