// Modo privado (Ajustes → Apariencia): los montos se ven borrosos hasta tocarlos, para abrir la
// app en público. El CSS oculta la utilidad `tabular` y las líneas con data-money; aquí se revela
// tocado durante unos segundos. El primer toque solo revela (no abre la fila que lo contiene).

const REVEAL_MS = 8000

function onPointer(event: MouseEvent) {
  if (!document.documentElement.hasAttribute('data-private')) return
  const target = event.target instanceof Element ? event.target : null
  const amount = target?.closest<HTMLElement>(
    ':is(.tabular, [data-money]):not(input):not(textarea)',
  )
  if (!amount || amount.hasAttribute('data-revealed')) return
  event.preventDefault()
  event.stopPropagation()
  amount.setAttribute('data-revealed', '')
  window.setTimeout(() => amount.removeAttribute('data-revealed'), REVEAL_MS)
}

let installed = false

/** Se instala una vez al arrancar; no hace nada mientras el modo privado esté apagado. */
export function installPrivacyReveal() {
  if (installed) return
  document.addEventListener('click', onPointer, true)
  installed = true
}
