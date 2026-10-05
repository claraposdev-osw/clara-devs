import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'clara-devs-auth',
  },
})

/**
 * Sign in with optional session persistence.
 * - rememberMe: true  → uses localStorage (persists after browser close)
 * - rememberMe: false → uses sessionStorage (cleared when browser closes)
 */
export async function signInWithPersistence(
  email: string,
  password: string,
  rememberMe: boolean
) {
  // Swap storage before signing in
  const storage = rememberMe ? window.localStorage : window.sessionStorage
  ;(supabase.auth as unknown as { storage: Storage }).storage = storage

  return supabase.auth.signInWithPassword({ email, password })
}
