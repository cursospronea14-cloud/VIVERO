'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Productos', href: '/admin/productos', icon: '🌵' },
  { name: 'Categorías', href: '/admin/categorias', icon: '📁' },
  { name: 'Empleados', href: '/admin/empleados', icon: '👥' },
  { name: 'Inventario', href: '/admin/inventario', icon: '📦' },
  { name: 'Ventas', href: '/admin/ventas', icon: '💰' },
  { name: 'Reportes', href: '/admin/reportes', icon: '📈' },
  { name: 'Configuración', href: '/admin/configuracion', icon: '⚙️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agave"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed left-0 top-0 h-full w-64 bg-agave text-white shadow-xl">
        <div className="p-4 border-b border-white/20">
          <h1 className="text-xl font-bold">Florece Admin</h1>
          <p className="text-xs text-arena mt-1">Panel de control</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                pathname === item.href
                  ? 'bg-white/20 text-white'
                  : 'hover:bg-white/10 text-white/80'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20">
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-3 text-white/80 hover:text-white w-full px-4 py-2 rounded-lg hover:bg-white/10"
          >
            <span>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
