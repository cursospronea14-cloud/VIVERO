'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface ReportData {
  totalSales: number
  totalOrders: number
  avgTicket: number
  topProducts: { name: string; total: number }[]
  salesByDay: { date: string; total: number }[]
}

export default function AdminReportes() {
  const [report, setReport] = useState<ReportData>({
    totalSales: 0,
    totalOrders: 0,
    avgTicket: 0,
    topProducts: [],
    salesByDay: [],
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => {
    // Fecha por defecto: últimos 30 días
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    })
  }, [])

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchReport()
    }
  }, [dateRange])

  async function fetchReport() {
    setLoading(true)
    
    // Ventas totales
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end + 'T23:59:59')
    
    const totalSales = orders?.reduce((sum, o) => sum + o.total, 0) || 0
    const totalOrders = orders?.length || 0
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0

    // Productos más vendidos (de los items JSON)
    const productSales: Record<string, number> = {}
    orders?.forEach(order => {
      if (order.items) {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
        items?.forEach((item: any) => {
          productSales[item.name] = (productSales[item.name] || 0) + (item.quantity || 0)
        })
      }
    })
    
    const topProducts = Object.entries(productSales)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Ventas por día
    const salesByDayMap: Record<string, number> = {}
    orders?.forEach(order => {
      const date = order.created_at.split('T')[0]
      salesByDayMap[date] = (salesByDayMap[date] || 0) + order.total
    })
    
    const salesByDay = Object.entries(salesByDayMap)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date))

    setReport({
      totalSales,
      totalOrders,
      avgTicket,
      topProducts,
      salesByDay,
    })
    setLoading(false)
  }

  const exportToCSV = () => {
    const headers = ['Fecha', 'Total ventas', 'N° pedidos', 'Ticket promedio']
    const rows = [headers]
    
    report.salesByDay.forEach(day => {
      const dayOrders = report.salesByDay.filter(d => d.date === day.date).length
      rows.push([day.date, `Q${day.total.toFixed(2)}`, dayOrders.toString(), ''])
    })
    
    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_${dateRange.start}_${dateRange.end}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="text-center py-12">Cargando reportes...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gris-texto">Reportes financieros</h1>
        <button onClick={exportToCSV} className="bg-agave text-white px-4 py-2 rounded-lg">
          📥 Exportar CSV
        </button>
      </div>

      {/* Filtro de fechas */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex gap-4">
        <div>
          <label className="block text-sm text-gris-suave mb-1">Desde</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="p-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gris-suave mb-1">Hasta</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="p-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gris-suave text-sm">Ventas totales</p>
          <p className="text-2xl font-bold text-agave">Q{report.totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gris-suave text-sm">N° pedidos</p>
          <p className="text-2xl font-bold text-flor">{report.totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gris-suave text-sm">Ticket promedio</p>
          <p className="text-2xl font-bold text-exito">Q{report.avgTicket.toFixed(2)}</p>
        </div>
      </div>

      {/* Productos más vendidos */}
      <div className="bg-white rounded-xl shadow-md mb-8">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Productos más vendidos</h2>
        </div>
        <div className="p-6">
          {report.topProducts.length === 0 ? (
            <p className="text-gris-suave">No hay datos</p>
          ) : (
            <div className="space-y-3">
              {report.topProducts.map((product, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>{idx + 1}. {product.name}</span>
                  <span className="font-medium text-agave">{product.total} unidades</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ventas por día (gráfico simple) */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Ventas por día</h2>
        </div>
        <div className="p-6">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {report.salesByDay.map((day) => (
              <div key={day.date} className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gris-suave">{day.date}</span>
                <span className="font-medium text-agave">Q{day.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
