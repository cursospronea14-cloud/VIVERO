import { createClient } from '@supabase/supabase-js'

// La URL es la misma
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Esta es la clave que copiaste de Supabase
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno para supabaseAdmin')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
