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
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      if (profile?.role !== 'admin') {
        router.push('/pos')
        return
      }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332]"></div></div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#1B4332] text-white shadow-xl">
        <div className="p-4 border-b"><img src="/logo.jpg" className="w-10 h-10 rounded-full" /><h1 className="font-bold">DESIERTO QUE FLORECE</h1></div>
        <nav className="p-4">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 p-3 rounded-xl ${pathname === item.href ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              <span>{item.icon}</span><span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 p-4 w-full border-t"><button onClick={() => supabase.auth.signOut()} className="w-full text-left">🚪 Cerrar sesión</button></div>
      </aside>
      <main className="ml-64 p-8">{children}</main>
    </div>
  )
}
