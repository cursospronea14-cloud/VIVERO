import { createClient } from '@supabase/supabase-js'

// Variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar si estamos en build time (Vercel) o en desarrollo local
const isBuildTime = typeof window === 'undefined' && (!supabaseUrl || !supabaseAnonKey)

if (isBuildTime) {
  console.warn('⚠️ Build time: Usando valores dummy para Supabase')
}

// Cliente de Supabase: real en runtime, dummy en build time
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: !isBuildTime,
      autoRefreshToken: !isBuildTime,
    },
  }
)
