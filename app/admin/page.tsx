'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalSales: number
  lowStock: number
  monthlySales: number
  todaySales: number
  pendingOrders: number
}

interface RecentOrder {
  id: number
  order_number: string
  customer_name: string
  total: number
  status: string
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    lowStock: 0,
    monthlySales: 0,
    todaySales: 0,
    pendingOrders: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    await Promise.all([
      fetchStats(),
      fetchRecentOrders(),
    ])
    setLoading(false)
  }

  async function fetchStats() {
    // Total productos
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Total pedidos
    const { data: ordersData } = await supabase
      .from('orders')
      .select('total, status, created_at')

    const totalOrders = ordersData?.length || 0
    const pendingOrders = ordersData?.filter(o => o.status === 'pending').length || 0
    const totalSales = ordersData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0

    // Ventas del mes actual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlySales = ordersData?.filter(o => new Date(o.created_at) >= startOfMonth)
      .reduce((sum, o) => sum + (o.total || 0), 0) || 0

    // Ventas de hoy
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const todaySales = ordersData?.filter(o => new Date(o.created_at) >= startOfDay)
      .reduce((sum, o) => sum + (o.total || 0), 0) || 0

    // Stock bajo
    const { data: lowStockData } = await supabase
      .from('branch_stock')
      .select('*')
      .lt('quantity', 5)

    setStats({
      totalProducts: productsCount || 0,
      totalOrders: totalOrders,
      totalSales: totalSales,
      lowStock: lowStockData?.length || 0,
      monthlySales: monthlySales,
      todaySales: todaySales,
      pendingOrders: pendingOrders,
    })
  }

  async function fetchRecentOrders() {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) setRecentOrders(data)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado'
      case 'pending': return 'Pendiente'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332]"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B4332]">Panel de Control</h1>
        <p className="text-[#6B6B6B] mt-1">Bienvenido al sistema de gestión de Florece</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-xl shadow-lg p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wide">Productos</p>
              <p className="text-2xl font-bold mt-1">{stats.totalProducts}</p>
            </div>
            <span className="text-2xl">🌵</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-[#E76F51]">
          <p className="text-[#6B6B6B] text-xs uppercase tracking-wide">Ventas Totales</p>
          <p className="text-xl font-bold text-[#1B4332] mt-1">{formatCurrency(stats.totalSales)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-[#2D6A4F]">
          <p className="text-[#6B6B6B] text-xs uppercase tracking-wide">Ventas del Mes</p>
          <p className="text-xl font-bold text-[#1B4332] mt-1">{formatCurrency(stats.monthlySales)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-[#E9D8A6]">
          <p className="text-[#6B6B6B] text-xs uppercase tracking-wide">Ventas Hoy</p>
          <p className="text-xl font-bold text-[#1B4332] mt-1">{formatCurrency(stats.todaySales)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-[#E76F51]">
          <p className="text-[#6B6B6B] text-xs uppercase tracking-wide">Pedidos Totales</p>
          <p className="text-2xl font-bold text-[#E76F51] mt-1">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-[#C53A1F]">
          <p className="text-[#6B6B6B] text-xs uppercase tracking-wide">Pedidos Pendientes</p>
          <p className="text-2xl font-bold text-[#C53A1F] mt-1">{stats.pendingOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-[#C53A1F]">
          <p className="text-[#6B6B6B] text-xs uppercase tracking-wide">Stock Bajo</p>
          <p className="text-2xl font-bold text-[#C53A1F] mt-1">{stats.lowStock}</p>
        </div>
      </div>

      {/* Pedidos recientes */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-5 border-b border-[#E9D8A6]">
          <h2 className="font-semibold text-[#1B4332] text-lg">📋 Pedidos recientes</h2>
        </div>
        <div className="divide-y divide-[#E9D8A6]">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-sm">{order.customer_name}</p>
                  <p className="text-xs text-[#6B6B6B]">{order.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1B4332] text-sm">{formatCurrency(order.total)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[#6B6B6B]">
              No hay pedidos registrados
            </div>
          )}
        </div>
        <div className="p-4 border-t border-[#E9D8A6] bg-gray-50">
          <Link href="/admin/ventas" className="text-sm text-[#1B4332] hover:underline flex items-center justify-center gap-1">
            Ver todos los pedidos →
          </Link>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/productos" className="bg-white rounded-xl shadow-md p-4 flex items-center gap-3 hover:shadow-lg transition group">
          <div className="w-10 h-10 bg-[#1B4332]/10 rounded-full flex items-center justify-center group-hover:bg-[#1B4332]/20 transition">
            <span className="text-xl">🌵</span>
          </div>
          <div>
            <p className="font-semibold text-[#1B4332] text-sm">Gestionar Productos</p>
            <p className="text-xs text-[#6B6B6B]">Agregar, editar o eliminar</p>
          </div>
        </Link>
        <Link href="/admin/empleados" className="bg-white rounded-xl shadow-md p-4 flex items-center gap-3 hover:shadow-lg transition group">
          <div className="w-10 h-10 bg-[#1B4332]/10 rounded-full flex items-center justify-center group-hover:bg-[#1B4332]/20 transition">
            <span className="text-xl">👥</span>
          </div>
          <div>
            <p className="font-semibold text-[#1B4332] text-sm">Gestionar Empleados</p>
            <p className="text-xs text-[#6B6B6B]">Altas, bajas y roles</p>
          </div>
        </Link>
        <Link href="/admin/inventario" className="bg-white rounded-xl shadow-md p-4 flex items-center gap-3 hover:shadow-lg transition group">
          <div className="w-10 h-10 bg-[#1B4332]/10 rounded-full flex items-center justify-center group-hover:bg-[#1B4332]/20 transition">
            <span className="text-xl">📦</span>
          </div>
          <div>
            <p className="font-semibold text-[#1B4332] text-sm">Control de Inventario</p>
            <p className="text-xs text-[#6B6B6B]">Revisar stock actual</p>
          </div>
        </Link>
        <Link href="/admin/reportes" className="bg-white rounded-xl shadow-md p-4 flex items-center gap-3 hover:shadow-lg transition group">
          <div className="w-10 h-10 bg-[#1B4332]/10 rounded-full flex items-center justify-center group-hover:bg-[#1B4332]/20 transition">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <p className="font-semibold text-[#1B4332] text-sm">Ver Reportes</p>
            <p className="text-xs text-[#6B6B6B]">Financieros y ventas</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
