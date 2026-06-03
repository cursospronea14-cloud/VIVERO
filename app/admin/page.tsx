'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    lowStock: 0,
    monthlySales: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [salesByDay, setSalesByDay] = useState<{ date: string; total: number }[]>([])
  const [salesByCategory, setSalesByCategory] = useState<{ name: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchRecentOrders(),
      fetchSalesByDay(),
      fetchSalesByCategory(),
    ]).finally(() => setLoading(false))
  }, [])

  async function fetchStats() {
    const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
    const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })
    const { data: salesData } = await supabase.from('orders').select('total, created_at')
    const totalSales = salesData?.reduce((sum, o) => sum + o.total, 0) || 0
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const monthlySales = salesData?.filter(o => o.created_at >= startOfMonth).reduce((sum, o) => sum + o.total, 0) || 0
    const { data: lowStockData } = await supabase.from('branch_stock').select('*').lt('quantity', 5)
    setStats({
      totalProducts: productsCount || 0,
      totalOrders: ordersCount || 0,
      totalSales,
      lowStock: lowStockData?.length || 0,
      monthlySales,
    })
  }

  async function fetchRecentOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5)
    if (data) setRecentOrders(data)
  }

  async function fetchSalesByDay() {
    const { data } = await supabase.from('orders').select('total, created_at')
    if (data) {
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const filtered = data.filter(o => o.created_at >= last7Days)
      const salesMap: Record<string, number> = {}
      filtered.forEach(o => {
        const date = o.created_at.split('T')[0]
        salesMap[date] = (salesMap[date] || 0) + o.total
      })
      const sorted = Object.entries(salesMap).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date))
      setSalesByDay(sorted)
    }
  }

  async function fetchSalesByCategory() {
    const { data: orders } = await supabase.from('orders').select('items')
    const categorySales: Record<string, number> = {}
    orders?.forEach(order => {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      items?.forEach((item: any) => {
        categorySales[item.name] = (categorySales[item.name] || 0) + (item.quantity || 0)
      })
    })
    const top = Object.entries(categorySales).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5)
    setSalesByCategory(top)
  }

  const barChartData = {
    labels: salesByDay.map(d => d.date.slice(5)),
    datasets: [{ label: 'Ventas (GTQ)', data: salesByDay.map(d => d.total), backgroundColor: '#2D6A4F', borderRadius: 8 }],
  }

  const doughnutChartData = {
    labels: salesByCategory.map(c => c.name),
    datasets: [{ data: salesByCategory.map(c => c.total), backgroundColor: ['#2D6A4F', '#E76F51', '#E9D8A6', '#38A169', '#C53A1F'], borderWidth: 0 }],
  }

  const cards = [
    { title: 'Productos', value: stats.totalProducts, icon: '🌵', color: 'bg-agave' },
    { title: 'Pedidos', value: stats.totalOrders, icon: '📦', color: 'bg-flor' },
    { title: 'Ventas totales', value: `Q${stats.totalSales.toFixed(2)}`, icon: '💰', color: 'bg-exito' },
    { title: 'Ventas del mes', value: `Q${stats.monthlySales.toFixed(2)}`, icon: '📈', color: 'bg-agave' },
    { title: 'Stock bajo', value: stats.lowStock, icon: '⚠️', color: 'bg-peligro' },
  ]

  if (loading) return <div className="text-center py-12">Cargando dashboard...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gris-texto mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.title} className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-gris-suave text-xs">{card.title}</p><p className="text-xl font-bold text-gris-texto mt-1">{card.value}</p></div>
              <div className={`${card.color} w-10 h-10 rounded-full flex items-center justify-center text-white text-lg`}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6"><h2 className="text-lg font-semibold mb-4">Ventas últimos 7 días</h2>{salesByDay.length ? <Bar data={barChartData} /> : <p className="text-center py-8">No hay datos</p>}</div>
        <div className="bg-white rounded-xl shadow-md p-6"><h2 className="text-lg font-semibold mb-4">Productos más vendidos</h2>{salesByCategory.length ? <Doughnut data={doughnutChartData} /> : <p className="text-center py-8">No hay datos</p>}</div>
      </div>
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b"><h2 className="text-lg font-semibold">Pedidos recientes</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs uppercase">N° Pedido</th><th className="px-6 py-3 text-left text-xs uppercase">Cliente</th><th className="px-6 py-3 text-left text-xs uppercase">Total</th><th className="px-6 py-3 text-left text-xs uppercase">Estado</th><th className="px-6 py-3 text-left text-xs uppercase">Fecha</th></tr></thead>
            <tbody>{recentOrders.map(order => (<tr key={order.id} className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-mono">{order.order_number}</td><td className="px-6 py-4 text-sm">{order.customer_name}</td><td className="px-6 py-4 text-sm font-medium text-agave">Q{order.total.toFixed(2)}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status === 'paid' ? 'Pagado' : 'Pendiente'}</span></td><td className="px-6 py-4 text-sm text-gris-suave">{new Date(order.created_at).toLocaleDateString()}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
