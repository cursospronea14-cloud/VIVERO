'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    lowStock: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentOrders()
  }, [])

  async function fetchStats() {
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    const { data: salesData } = await supabase
      .from('orders')
      .select('total')

    const totalSales = salesData?.reduce((sum, o) => sum + o.total, 0) || 0

    const { data: lowStockData } = await supabase
      .from('branch_stock')
      .select('*')
      .lt('quantity', 5)

    setStats({
      totalProducts: productsCount || 0,
      totalOrders: ordersCount || 0,
      totalSales: totalSales,
      lowStock: lowStockData?.length || 0,
    })
    setLoading(false)
  }

  async function fetchRecentOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) setRecentOrders(data)
  }

  const cards = [
    { title: 'Productos', value: stats.totalProducts, icon: '🌵', color: 'bg-agave' },
    { title: 'Pedidos', value: stats.totalOrders, icon: '📦', color: 'bg-flor' },
    { title: 'Ventas totales', value: `Q${stats.totalSales.toFixed(2)}`, icon: '💰', color: 'bg-exito' },
    { title: 'Stock bajo', value: stats.lowStock, icon: '⚠️', color: 'bg-peligro' },
  ]

  if (loading) {
    return <div className="text-center py-12">Cargando dashboard...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gris-texto mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gris-suave text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-gris-texto mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center text-white text-xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gris-texto">Pedidos recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">N° Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{order.order_number}</td>
                  <td className="px-6 py-4 text-sm">{order.customer_name}</td>
                  <td className="px-6 py-4 text-sm font-medium text-agave">Q{order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'paid' ? 'bg-exito/20 text-exito' :
                      order.status === 'pending' ? 'bg-peligro/20 text-peligro' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {order.status === 'paid' ? 'Pagado' : order.status === 'pending' ? 'Pendiente' : order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gris-suave">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
