import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase/client'
import { toUserMessage } from '../../lib/errors'
import { Button } from '../../components/ui/Button'
import { Field, TextInput } from '../../components/ui/Field'
import { ErrorState } from '../../components/ui/States'

const schema = z.object({
  email: z.email('Escribe un email válido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
})

type FormValues = z.infer<typeof schema>

// Sin registro ni recuperación en la app: las dos cuentas se crean en Supabase (docs/SUPABASE.md).
export function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    // Con éxito, AuthProvider recibe la sesión y PublicOnly redirige a la app.
    if (signInError) setError(toUserMessage(signInError))
  })

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-lg font-bold tracking-tight">BULLMILTON</p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Entra para ver cómo van las cuentas de la casa
        </h1>
      </header>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {error && <ErrorState message={error} />}
        <Field label="Email" error={errors.email?.message}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('email')}
            />
          )}
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              type="password"
              autoComplete="current-password"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('password')}
            />
          )}
        </Field>
        <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
          {isSubmitting ? 'Entrando' : 'Entrar'}
        </Button>
      </form>

      <p className="text-sm text-fg-muted">
        ¿Olvidaste la contraseña? Se cambia desde el panel de Supabase, en Authentication → Users.
      </p>
    </main>
  )
}
