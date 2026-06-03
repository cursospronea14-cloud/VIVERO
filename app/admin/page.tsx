'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    lowStock: 0,
    monthlySales: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    await Promise.all([
      fetchStats(),
      fetchRecentOrders(),
      fetchFeaturedProducts(),
      fetchLowStockProducts(),
    ])
    setLoading(false)
  }

  async function fetchStats() {
    const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
    const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })
    const { data: salesData } = await supabase.from('orders').select('total, created_at')
    const totalSales = salesData?.reduce((sum, o) => sum + o.total, 0) || 0
    
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const monthlySales = salesData?.filter(o => o.created_at >= startOfMonth).reduce((sum, o) => sum + o.total, 0) || 0
    
    setStats({
      totalProducts: productsCount || 0,
      totalOrders: ordersCount || 0,
      totalSales,
      lowStock: 0,
      monthlySales,
    })
  }

  async function fetchRecentOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5)
    if (data) setRecentOrders(data)
  }

  async function fetchFeaturedProducts() {
    const { data } = await supabase.from('products').select('id, name, base_price, image_url').eq('is_active', true).limit(6)
    if (data) setFeaturedProducts(data)
  }

  async function fetchLowStockProducts() {
    const { data } = await supabase.from('branch_stock').select('product_id, quantity, products(name)').lt('quantity', 5).limit(5)
    if (data) setLowStockProducts(data)
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-start">
            <div><p className="text-white/80 text-sm">Total Productos</p><p className="text-3xl font-bold mt-1">{stats.totalProducts}</p></div>
            <span className="text-3xl">🌵</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#E76F51]">
          <p className="text-[#6B6B6B] text-sm">Pedidos</p>
          <p className="text-2xl font-bold text-[#1B4332] mt-1">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#2D6A4F]">
          <p className="text-[#6B6B6B] text-sm">Ventas Totales</p>
          <p className="text-2xl font-bold text-[#1B4332] mt-1">Q{stats.totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#E9D8A6]">
          <p className="text-[#6B6B6B] text-sm">Ventas del Mes</p>
          <p className="text-2xl font-bold text-[#1B4332] mt-1">Q{stats.monthlySales.toFixed(2)}</p>
        </div>
      </div>

      {/* Featured Products */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#1B4332]">🌵 Productos Destacados</h2>
          <Link href="/admin/productos" className="text-[#E76F51] text-sm hover:underline">Ver catálogo completo →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {featuredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group">
              <div className="h-32 bg-[#F5F5F0] flex items-center justify-center group-hover:bg-[#E9D8A6]/30 transition">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} width={80} height={80} className="object-cover" />
                ) : (
                  <span className="text-4xl">🌵</span>
                )}
              </div>
              <div className="p-3 text-center">
                <p className="font-medium text-sm text-[#2D2D2D] truncate">{product.name}</p>
                <p className="text-[#1B4332] font-bold text-sm">Q{product.base_price?.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-4 border-b border-[#E9D8A6]">
            <h2 className="font-semibold text-[#1B4332]">📋 Pedidos Recientes</h2>
          </div>
          <div className="divide-y divide-[#E9D8A6]">
            {recentOrders.length > 0 ? recentOrders.map((order) => (
              <div key={order.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-medium text-sm">{order.customer_name}</p>
                  <p className="text-xs text-[#6B6B6B]">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1B4332]">Q{order.total?.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            )) : <div className="p-8 text-center text-[#6B6B6B]">No hay pedidos recientes</div>}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-4 border-b border-[#E9D8A6]">
            <h2 className="font-semibold text-[#E76F51]">⚠️ Alertas de Stock Bajo</h2>
          </div>
          <div className="divide-y divide-[#E9D8A6]">
            {lowStockProducts.length > 0 ? lowStockProducts.map((item, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{item.products?.name || 'Producto'}</p>
                  <p className="text-xs text-[#6B6B6B]">Stock actual: {item.quantity} unidades</p>
                </div>
                <Link href="/admin/inventario" className="text-[#1B4332] text-sm hover:underline">Reabastecer →</Link>
              </div>
            )) : <div className="p-8 text-center text-[#6B6B6B]">✓ Todos los productos tienen stock suficiente</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
