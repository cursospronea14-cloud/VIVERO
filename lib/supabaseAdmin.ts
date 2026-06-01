import { createClient } from '@supabase/supabase-js'

const DEFAULT_URL = 'https://placeholder.supabase.co'
const DEFAULT_KEY = 'placeholder'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const isBuildTime = typeof window === 'undefined'

const finalUrl = (!isBuildTime && supabaseUrl) ? supabaseUrl : DEFAULT_URL
const finalKey = (!isBuildTime && supabaseServiceKey) ? supabaseServiceKey : DEFAULT_KEY

export const supabaseAdmin = createClient(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
