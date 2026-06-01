/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['qpdmianwkfsihjthcliu.supabase.co'],
  },
  // Forzar que las variables estén disponibles
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  // Evitar prerenderizado estático
  output: 'standalone',
}

module.exports = nextConfig
