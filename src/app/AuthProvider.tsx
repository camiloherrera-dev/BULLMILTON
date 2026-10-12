import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase/client'
import { AuthContext, type AuthState } from './auth-context'

function toState(session: Session | null): AuthState {
  if (!session) return { status: 'signedOut' }
  return {
    status: 'signedIn',
    session,
    userId: session.user.id,
    email: session.user.email ?? '',
  }
}

// Sesión persistente (spec §4.1): Supabase la guarda en el navegador y renueva el token solo.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState(toState(data.session))
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Mantener el mismo objeto si solo se renovó el token evita recargar toda la app.
      setState((previous) =>
        previous.status === 'signedIn' && session && previous.userId === session.user.id
          ? { ...previous, session }
          : toState(session),
      )
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
