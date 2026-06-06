'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      setUser(session.user)
      
      // Cargar estadísticas
      const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
      const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })
      const { data: salesData } = await supabase.from('orders').select('total')
      const totalSales = salesData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
      
      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalSales: totalSales,
      })
      setLoading(false)
    }
    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332]"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B4332]">Dashboard Administrador</h1>
        <p className="text-gray-500 mt-1">Bienvenido, {user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-xl shadow-lg p-6 text-white">
          <p className="text-white/70 text-sm">Total Productos</p>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#E76F51]">
          <p className="text-gray-500 text-sm">Total Pedidos</p>
          <p className="text-2xl font-bold text-[#1B4332]">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#2D6A4F]">
          <p className="text-gray-500 text-sm">Ventas Totales</p>
          <p className="text-2xl font-bold text-[#1B4332]">Q{stats.totalSales.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/productos" className="bg-white rounded-xl shadow-md p-4 flex items-center gap-3 hover:shadow-lg transition">
          <span className="text-2xl">🌵</span>
          <div><p className="font-semibold">Productos</p><p className="text-xs text-gray-500">Gestionar catálogo</p></div>
        </Link>
        <Link href="/admin/empleados" className="bg-white rounded-xl shadow-md p-4 flex items-center gap-3 hover:shadow-lg transition">
          <span className="text-2xl">👥</span>
          <div><p className="font-semibold">Empleados</p><p className="text-xs text-gray-500">Gestionar personal</p></div>
        </Link>
        <Link href="/admin/inventario" className="bg-white rounded-xl shadow-md p-4 flex items-center gap-3 hover:shadow-lg transition">
          <span className="text-2xl">📦</span>
          <div><p className="font-semibold">Inventario</p><p className="text-xs text-gray-500">Control de stock</p></div>
        </Link>
        <Link href="/admin/ventas" className="bg-white rounded-xl shadow-md p-4 flex items-center gap-3 hover:shadow-lg transition">
          <span className="text-2xl">💰</span>
          <div><p className="font-semibold">Ventas</p><p className="text-xs text-gray-500">Historial de pedidos</p></div>
        </Link>
      </div>
    </div>
  )
}
