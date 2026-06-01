import { createClient } from '@supabase/supabase-js'

// Verificar que las variables existen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Si no están disponibles (build time), devolver un cliente dummy
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variables de entorno de Supabase no disponibles')
  // Exportar un cliente dummy que no falle
  export const supabase = createClient('https://placeholder.supabase.co', 'placeholder', {
    auth: { persistSession: false, autoRefreshToken: false }
  })
} else {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey)
}
