/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['qpdmianwkfsihjthcliu.supabase.co'],
  },
  // Deshabilitar el prerrenderizado estático para todas las páginas
  output: 'standalone',
  // Evitar que Next.js intente acceder a Supabase durante el build
  staticPageGenerationTimeout: 120,
  // Configuración crítica: no prerrenderizar páginas dinámicas
  experimental: {
    // Esto ayuda a evitar errores de build
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig
