import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Florece - Cactus y Suculentas',
  description: 'Dios hace florecer el desierto. Isaías 35:1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
