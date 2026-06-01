import { createClient } from '@supabase/supabase-js'

// Obtener variables con fallback para build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Si estamos en build time (sin variables), crear un cliente dummy
const isBuildTime = !supabaseUrl || !supabaseAnonKey

if (isBuildTime && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Build time: Usando cliente dummy de Supabase')
}

// Cliente dummy para build time, real para runtime
export const supabase = createClient(
  isBuildTime ? 'https://placeholder.supabase.co' : supabaseUrl,
  isBuildTime ? 'placeholder' : supabaseAnonKey,
  {
    auth: {
      persistSession: !isBuildTime,
      autoRefreshToken: !isBuildTime,
    },
  }
)
