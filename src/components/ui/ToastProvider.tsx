import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { ToastContext, type ToastTone } from './toast-context'

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

/** Avisos breves tras guardar o fallar (spec §42: "Gasto guardado ✓"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    nextId.current += 1
    const id = nextId.current
    setToasts((current) => [...current.slice(-2), { id, message, tone }])
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      tone === 'error' ? 6000 : 3200,
    )
  }, [])

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
            className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm font-medium text-fg shadow-[0_8px_24px_-8px_var(--color-canvas)] motion-safe:animate-[toast-in_220ms_var(--ease-out-expo)]"
          >
            {toast.tone === 'success' ? (
              <CheckCircleIcon aria-hidden="true" className="size-5 text-positive" weight="fill" />
            ) : (
              <WarningCircleIcon
                aria-hidden="true"
                className="size-5 text-negative"
                weight="fill"
              />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
