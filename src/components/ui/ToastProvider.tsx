import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { ToastContext, type ToastAction, type ToastOptions, type ToastTone } from './toast-context'

interface Toast {
  id: number
  message: string
  tone: ToastTone
  actions: ToastAction[]
}

/** Avisos breves tras guardar o fallar (spec §42: "Gasto guardado ✓"), con acciones opcionales. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback(
    (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)),
    [],
  )

  const show = useCallback(
    (message: string, tone: ToastTone = 'success', options: ToastOptions = {}) => {
      nextId.current += 1
      const id = nextId.current
      const actions = options.actions ?? []
      setToasts((current) => [...current.slice(-2), { id, message, tone, actions }])
      // Con acciones hay que dar tiempo a leer y decidir (WCAG 2.2.1).
      window.setTimeout(() => dismiss(id), actions.length ? 10000 : tone === 'error' ? 6000 : 3200)
    },
    [dismiss],
  )

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-md flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border border-line-strong bg-surface py-2 pr-2 pl-4 text-sm font-medium text-fg shadow-[0_8px_24px_-8px_var(--shadow-tint)] motion-safe:animate-[toast-in_220ms_var(--ease-out-expo)]"
          >
            <span className="flex min-h-11 flex-1 items-center gap-2.5">
              {toast.tone === 'success' ? (
                <CheckCircleIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-positive"
                  weight="fill"
                />
              ) : (
                <WarningCircleIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-negative"
                  weight="fill"
                />
              )}
              {toast.message}
            </span>
            {toast.actions.length > 0 && (
              <span className="flex gap-1">
                {toast.actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      dismiss(toast.id)
                      action.onClick()
                    }}
                    className="h-11 rounded-lg px-3 font-semibold text-primary transition-colors hover:bg-surface-2"
                  >
                    {action.label}
                  </button>
                ))}
              </span>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
