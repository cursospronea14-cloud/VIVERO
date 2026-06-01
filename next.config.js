/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['qpdmianwkfsihjthcliu.supabase.co'],
  },
  // Eliminamos la sección 'env' que causaba el error
  // Las variables de entorno se manejan directamente en Vercel
}

module.exports = nextConfig
