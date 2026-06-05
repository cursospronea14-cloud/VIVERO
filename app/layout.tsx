import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Diserto que Florece - Cactus y Suculentas',
  description: 'Sistema de gestión de vivero',
  icons: {
    icon: '/logo.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Header />
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
