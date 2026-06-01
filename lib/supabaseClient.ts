// Este archivo NO debe fallar aunque falten variables en build time
import { createClient } from '@supabase/supabase-js'

// Valores dummy para build time (NUNCA se usan en producción real)
const DEFAULT_URL = 'https://placeholder.supabase.co'
const DEFAULT_KEY = 'placeholder'

// Obtener variables del entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Detectar si estamos en build time (Vercel)
// En build time, 'process.env.NODE_ENV' === 'production' pero window no existe
const isBuildTime = typeof window === 'undefined'

// Usar valores reales SOLO si existen Y no estamos en build time
const finalUrl = (!isBuildTime && supabaseUrl) ? supabaseUrl : DEFAULT_URL
const finalKey = (!isBuildTime && supabaseAnonKey) ? supabaseAnonKey : DEFAULT_KEY

// Solo mostrar warning si estamos en runtime (no en build)
if (!isBuildTime && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('❌ Error: Faltan variables de entorno de Supabase en runtime')
}

export const supabase = createClient(finalUrl, finalKey)
