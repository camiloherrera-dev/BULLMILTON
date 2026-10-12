---
name: BULLMILTON
description: Libreta financiera compartida para un hogar de dos; el saldo entre ambos como respuesta principal.
colors:
  canvas: '#0b0f14'
  surface: '#151b22'
  surface-2: '#202832'
  fg: '#f3f4f6'
  fg-muted: '#9ca3af'
  primary: '#f4c542'
  primary-soft: '#ffe58a'
  on-primary: '#0b0f14'
  positive: '#35c978'
  positive-bg: '#123d2a'
  negative: '#f05252'
  line: 'color-mix(in oklab, #f3f4f6 9%, transparent)'
  line-strong: 'color-mix(in oklab, #f3f4f6 16%, transparent)'
  primary-wash: 'color-mix(in oklab, #f4c542 14%, transparent)'
  negative-bg: 'color-mix(in oklab, #f05252 16%, #151b22)'
  scrim: 'color-mix(in oklab, #0b0f14 72%, transparent)'
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 'clamp(2.25rem, 12vw, 3.75rem)'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: '-0.025em'
    fontFeature: "'tnum' 1"
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: '1.5rem'
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: '-0.025em'
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: '1rem'
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: '0.9375rem'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: '0.875rem'
    fontWeight: 500
    lineHeight: 1.43
  caption:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.33
rounded:
  control: '12px'
  panel: '16px'
  chip: '9999px'
spacing:
  page-x-mobile: '16px'
  page-x-tablet: '24px'
  page-x-desktop: '40px'
  stack: '24px'
  column-gap: '32px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.control}'
    padding: '0 16px'
    height: '48px'
  button-primary-hover:
    backgroundColor: '{colors.primary-soft}'
  button-secondary:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg}'
    rounded: '{rounded.control}'
    padding: '0 16px'
    height: '48px'
  button-secondary-hover:
    backgroundColor: '{colors.line-strong}'
  button-danger:
    backgroundColor: '{colors.negative-bg}'
    textColor: '{colors.negative}'
    rounded: '{rounded.control}'
    height: '48px'
  input:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg}'
    rounded: '{rounded.control}'
    padding: '0 14px'
    height: '48px'
  segmented-track:
    backgroundColor: '{colors.surface-2}'
    rounded: '{rounded.control}'
    padding: '4px'
  segmented-selected:
    backgroundColor: '{colors.fg}'
    textColor: '{colors.canvas}'
    height: '44px'
  chip-period:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.fg-muted}'
    rounded: '{rounded.chip}'
    padding: '0 16px'
    height: '44px'
  chip-period-selected:
    backgroundColor: '{colors.fg}'
    textColor: '{colors.canvas}'
  chip-status-positive:
    backgroundColor: '{colors.positive-bg}'
    textColor: '{colors.positive}'
    rounded: '{rounded.chip}'
    height: '32px'
  chip-status-negative:
    backgroundColor: '{colors.negative-bg}'
    textColor: '{colors.negative}'
    rounded: '{rounded.chip}'
    height: '32px'
  panel:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.panel}'
    padding: '20px'
  ledger-sheet:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.panel}'
    padding: '12px 16px'
  compact-balance-bar:
    backgroundColor: '{colors.surface}'
    height: '48px'
---

# Design System: BULLMILTON

## Overview

**Creative North Star: "El libro diario del hogar"**

BULLMILTON es una superficie de trabajo, no una vitrina. Se abre para responder una sola pregunta (quién le debe cuánto a quién) y para registrar un movimiento en segundos, casi siempre con una mano en el celular. Todo el sistema se organiza como un libro contable de casa: movimientos agrupados por día, cada día cerrado con su saldo acumulado, y cifras tabulares alineadas a la derecha que se leen en columna.

El mundo es oscuro por mandato de la especificación (§40.1): fondo Deep Navy, hojas Dark Slate, controles Slate. La profundidad se construye por capas tonales y reglas finas, no por sombras. El amarillo es escaso y significa algo concreto (actuar, hoy, atención); el verde y el rojo siempre viajan con signo o texto. La densidad es media: filas de 44px o más, sin decoración, con el saldo grande como única pieza de escala dramática.

Rechazo confirmado: el dashboard de tarjetas sueltas (saldo + widgets + lista genérica). El libro diario es la estructura.

**Key Characteristics:**

- Tema oscuro único; sin tema claro.
- Capas tonales canvas, surface, surface-2 en lugar de sombras.
- Cifras tabulares, alineadas a la derecha, con signo explícito.
- Amarillo solo para acción, el día de hoy y datos que piden atención.
- Una sola regla de radios: controles 12px, paneles 16px, chips completos.
- Selección = relleno Soft White con texto oscuro en semibold.

## Colors

Paleta obligatoria de la spec §40.1, documentada tal cual; los derivados son mezclas `color-mix` de esos mismos colores, no colores nuevos. Los valores viven únicamente en `src/styles/tokens.css` y se consumen como utilidades Tailwind (`bg-canvas`, `text-fg-muted`) o variables (`var(--color-primary)`). Nunca HEX sueltos en componentes.

### Primary

- **Finance Yellow** (`primary`): botón principal (+ Gasto, Guardar), el encabezado del día de hoy en el libro, el icono activo de la barra inferior, las barras de magnitud del resumen del mes y de reportes, el anillo de foco, el caret y la selección de texto.
- **Soft Yellow** (`primary-soft`): estado hover del botón principal.
- **On Primary** (`on-primary`, igual a `canvas`): texto e iconos sobre amarillo.
- **Primary Wash** (`primary-wash`): halo del foco en inputs y fondo del panel de pendientes recurrentes (dato que pide atención), siempre con borde amarillo al 40%.

### Secondary (estados financieros)

- **Finance Green** (`positive`): efecto a tu favor, ingresos, completado.
- **Deep Green** (`positive-bg`): fondo de chips e iconos de ingreso.
- **Expense Red** (`negative`): efecto en tu contra, errores, borde de input inválido. Con moderación.
- **Red Wash** (`negative-bg`): fondo del chip "En tu contra" y del botón de peligro.

### Neutral

- **Deep Navy** (`canvas`): fondo general de la app y texto sobre amarillo o sobre Soft White.
- **Dark Slate** (`surface`): hojas del libro, paneles, barra lateral, barra inferior, barra compacta del saldo, diálogos y toasts.
- **Slate** (`surface-2`): inputs, botones secundarios, pista de controles segmentados, chips sin seleccionar, círculo de icono de categoría, hover de filas.
- **Soft White** (`fg`): títulos, contenido principal y relleno del estado seleccionado.
- **Muted Gray** (`fg-muted`): descripciones, metadatos, línea secundaria de filas, pestañas inactivas.
- **Hairline** (`line`): divisores entre filas y bordes de barras fijas.
- **Strong Hairline** (`line-strong`): doble regla del encabezado de día, borde de diálogos y toasts, hover de input, hover de botón secundario.
- **Scrim** (`scrim`): fondo detrás de diálogos modales.

### Named Rules

**The Yellow Means Act Rule.** El amarillo marca acciones, el día de hoy y datos que piden atención (barras de magnitud, pendientes). Nunca es fondo decorativo.

**The Sign Travels With Color Rule.** Verde y rojo nunca son el único indicador: siempre van con signo (+ / −) o texto ("a tu favor", "en tu contra").

**The Dark Only Rule.** Solo existe el tema oscuro (`color-scheme: dark`). No hay tema claro ni conmutador.

## Typography

**Display Font:** pila del sistema (system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif)
**Body Font:** la misma pila del sistema
**Label/Mono Font:** la misma pila; las cifras usan la utilidad `tabular` (`font-variant-numeric: tabular-nums`, `tnum`)

**Character:** una voz única, neutra y nativa del dispositivo; la jerarquía sale del peso (400, 500, 600) y del tamaño, y las cifras se alinean por figuras tabulares.

**Decisión abierta.** La pila del sistema para todo es el estado actual, no una decisión cerrada. La revisión de acabado recomendó una tipografía de display autoalojada con figuras tabulares para la cifra del saldo, la columna de dinero y el wordmark; el usuario aún no ha decidido. Hasta entonces, no introducir fuentes nuevas ni tratar la pila del sistema como regla definitiva.

### Hierarchy

- **Display** (600, clamp(2.25rem, 12vw, 3.75rem), interlineado ajustado, tracking ajustado, tabular): solo la cifra del saldo en Inicio.
- **Headline** (600, 1.5rem, tracking ajustado, text-balance): título de página en el encabezado de cada pantalla.
- **Title** (600, 1rem a 1.875rem tabular para totales): títulos de panel ("octubre") y totales del mes.
- **Body** (400, 0.9375rem, 1.5): texto base; filas del libro en 500 para la descripción.
- **Label** (500, 0.875rem): etiquetas de campo, botones pequeños, línea secundaria, encabezados de día en 600.
- **Caption** (400, 0.75rem): subtexto de la columna de efecto ("de $120.000", "a tu favor"); etiquetas de pestaña a 0.6875rem.

### Named Rules

**The Tabular Money Rule.** Toda cifra de dinero usa `tabular` y se alinea a la derecha cuando está en columna.

**The Sixteen Pixel Input Rule.** Inputs, selects y textareas usan 16px (`text-base`) para evitar el zoom en iOS.

## Layout

Contenedor centrado con márgenes de 16px en móvil, 24px desde `sm` y 40px desde `lg`. Anchos máximos por tipo de pantalla: formularios 672px (`max-w-2xl`), listas 896px (`max-w-4xl`), Inicio y reportes 1152px (`max-w-6xl`).

Escritorio (`lg`, 1024px): barra lateral fija de 248px (wordmark, hogar, acciones rápidas apiladas, navegación, usuario) y contenido a la derecha. Desde `xl` (1280px) Inicio pasa a dos columnas: libro a la izquierda y columna de 320px pegajosa con pendientes y resumen del mes, separadas por 32px.

Móvil: barra inferior fija sobre Dark Slate con las acciones rápidas (+ Gasto amarillo, + Ingreso y + Transferencia secundarias, en rejilla 1.15fr / 1fr / 1.3fr) encima de 4 pestañas (Inicio, Movimientos, Reportes, Ajustes). La barra solo aparece en las pantallas de pestaña; formularios y detalles tienen volver y guardar en la zona del pulgar. En Inicio móvil los pendientes van sobre el libro y el resumen después. Se respetan las áreas seguras (`env(safe-area-inset-*)`).

Ritmo vertical: 24px entre bloques de página, 16px dentro de paneles, 6px entre etiqueta y campo.

### Named Rules

**The Thumb Zone Rule.** Las acciones de registro viven en la zona del pulgar en móvil y en la barra lateral en escritorio; siempre a un toque desde las pestañas.

**The Forty Four Rule.** Todo objetivo táctil mide 44px o más (botones 44, 48 o 56px; pestañas 56px; filas del libro 64px).

## Elevation & Depth

Sistema plano por capas tonales: canvas, luego surface, luego surface-2, con reglas finas (`line`, `line-strong`) para separar. Las superficies no tienen sombra en reposo. La única sombra es una sombra ambiental difusa para capas flotantes (toasts y tooltip del gráfico), teñida con el propio canvas.

### Shadow Vocabulary

- **Floating ambient** (`box-shadow: 0 8px 24px -8px var(--color-canvas)`): toasts y tooltip del gráfico mensual. Nada más.

### Named Rules

**The Tonal Depth Rule.** La profundidad se expresa con capas tonales y reglas finas; las sombras quedan reservadas a capas flotantes transitorias.

## Shapes

Una sola regla de radios para toda la app: controles (botones, inputs, selects, filas con hover, toasts) 12px; paneles (hoja del libro, resumen, pendientes, diálogos) 16px; chips, círculos de icono y barras de magnitud completamente redondeados. Dentro de una pista segmentada de 12px, la píldora seleccionada usa 8px para quedar concéntrica. Bordes de 1px solo con `line` o `line-strong`; el encabezado de día usa una doble regla de 3px.

### Named Rules

**The One Radius Rule.** Controles 12px, paneles 16px, chips completos. No hay otros radios salvo el anidado concéntrico.

## Components

### Buttons

Firmes y directos, sin adornos.

- **Shape:** esquinas suaves de control (12px).
- **Primary:** Finance Yellow con texto Deep Navy en semibold; alturas 44px (sm), 48px (md), 56px (lg).
- **Hover / Focus:** hover a Soft Yellow; foco con contorno amarillo de 2px a 2px de distancia; al presionar escala a 0.98. Transición de 150ms con `ease-out-expo`.
- **Secondary:** Slate con texto Soft White; hover a `line-strong`.
- **Ghost:** sin fondo; hover a Slate.
- **Danger:** Red Wash con texto Expense Red.
- **Loading:** spinner circular en el color del texto; el botón queda deshabilitado y con `aria-busy`.

### Chips

- **Estado del saldo:** 32px, píldora, icono Phosphor en negrita + texto ("A tu favor" en verde sobre Deep Green, "En tu contra" en rojo sobre Red Wash, "Están a paz y salvo" en gris sobre Slate).
- **Periodo (reportes) y atajos de división:** 44px, píldora, Slate con texto Muted Gray.
- **Seleccionado:** relleno Soft White con texto Deep Navy en semibold.

### Segmented controls

- Pista Slate de 12px con 4px de relleno; opciones de 44px (40px en tamaño sm).
- **Seleccionado:** relleno Soft White con texto Deep Navy en semibold. Grupo de radio nativo, una sola parada de tab, navegable con flechas.

### Cards / Containers

- **Corner Style:** 16px.
- **Background:** Dark Slate sobre Deep Navy.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** ninguno, salvo el panel de pendientes (borde amarillo al 40% sobre Primary Wash) y diálogos (`line-strong`).
- **Internal Padding:** 20px en paneles; 12px por 16px (20px desde `sm`) en la hoja del libro.

### Inputs / Fields

- **Style:** Slate, borde transparente de 1px, 12px de radio, 48px de alto, 16px de texto, etiqueta arriba en 500 y 14px; nunca placeholder como etiqueta.
- **Focus:** borde amarillo y halo de 2px en Primary Wash; caret amarillo.
- **Error / Disabled:** borde Expense Red y mensaje en rojo con icono de advertencia debajo; deshabilitado al 50% de opacidad.

### Navigation

- **Barra lateral (escritorio):** enlaces de 44px, 14px en 500; activo con fondo Slate, texto Soft White e icono relleno; inactivo en Muted Gray.
- **Pestañas (móvil):** 56px, icono de 24px sobre etiqueta de 11px; activa con icono relleno en amarillo y etiqueta Soft White.
- **Iconos:** Phosphor como única familia (exportaciones `*Icon`), peso regular en reposo, relleno para activo, negrita en botones y chips. Las claves de icono de categoría se mapean en `src/components/movements/categoryIcons.ts`.

### Libro diario (signature)

La estructura que define a BULLMILTON.

- **Encabezado de día:** fecha a la izquierda (14px, 600; en amarillo si es hoy) y "saldo X" a la derecha en Muted Gray con la cifra de cierre en Soft White semibold y tabular; debajo, doble regla de 3px en `line-strong`.
- **Filas:** sobre la hoja Dark Slate, separadas por `line`; círculo de icono de 40px (Deep Green para ingresos, Slate para el resto), descripción en 500 con línea secundaria de quién y división en Muted Gray, y columna de efecto a la derecha: cifra con signo en verde o rojo, subtexto de 12px ("de $X", "a tu favor"). Ingresos y anulados muestran el monto en gris; los anulados van tachados.
- **Hover:** fondo Slate al 70% con radio de control.

### Saldo grande y barra compacta (signature)

- **Saldo:** frase en 18px Muted Gray ("Beto te debe") sobre la cifra Display tabular; debajo, chip de estado y acción secundaria ("Registrar abono").
- **Barra compacta:** al salir el saldo del viewport, una barra fija de 48px en Dark Slate con borde `line` aparece arriba (frase a la izquierda, cifra en verde o rojo a la derecha), entrando con opacidad y 8px de desplazamiento en 200ms `ease-out-expo`.

### Motion

- Duraciones 150 a 250ms con `ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`), solo para cambios de estado (hover, foco, presión, barra compacta, entrada de toasts).
- **Movimiento reducido:** se eliminan desplazamientos, escalas y pulsos (skeletons); se mantienen los cambios de opacidad y color, y el spinner de carga sigue girando porque es feedback.

## Do's and Don'ts

### Do:

- **Do** tomar todo color de `src/styles/tokens.css` mediante utilidades o `var(--color-*)`.
- **Do** usar amarillo solo para acciones, el día de hoy y datos que piden atención (barras de magnitud, pendientes).
- **Do** acompañar verde y rojo con signo (+ / −) o texto.
- **Do** mostrar toda cifra de dinero con `tabular`, alineada a la derecha en columnas.
- **Do** marcar la selección con relleno Soft White y texto Deep Navy en semibold.
- **Do** aplicar la regla de radios: controles 12px, paneles 16px, chips completos.
- **Do** mantener objetivos táctiles de 44px o más e inputs de 16px.
- **Do** limitar la animación a 150 a 250ms con `ease-out-expo` y respetar el movimiento reducido.

### Don't:

- **Don't** usar el amarillo como fondo decorativo.
- **Don't** usar color como único indicador de saldo o estado.
- **Don't** introducir un tema claro ni fondos claros.
- **Don't** añadir colores fuera de la paleta §40.1 ni sus mezclas derivadas.
- **Don't** convertir Inicio en un dashboard de tarjetas sueltas; el libro diario es la estructura.
- **Don't** mezclar familias de iconos; solo Phosphor.
- **Don't** usar sombras para elevar paneles en reposo.
- **Don't** tratar la pila tipográfica del sistema como decisión cerrada mientras siga abierta.
