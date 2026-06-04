'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface ReportData {
  totalSales: number
  totalOrders: number
  avgTicket: number
  topProducts: { name: string; total: number; revenue: number }[]
  salesByDay: { date: string; total: number; count: number }[]
  salesByCategory: { name: string; total: number; percentage: number }[]
  paymentMethods: { method: string; total: number; count: number }[]
}

export default function AdminReportes() {
  const [report, setReport] = useState<ReportData>({
    totalSales: 0,
    totalOrders: 0,
    avgTicket: 0,
    topProducts: [],
    salesByDay: [],
    salesByCategory: [],
    paymentMethods: [],
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [reportType, setReportType] = useState('ventas')

  useEffect(() => {
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
    
    try {
      // Ventas totales en el rango
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59')
      
      const totalSales = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
      const totalOrders = orders?.length || 0
      const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0

      // Productos más vendidos
      const productSales: Record<string, { total: number; revenue: number }> = {}
      orders?.forEach(order => {
        if (order.items) {
          const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
          items?.forEach((item: any) => {
            if (!productSales[item.name]) {
              productSales[item.name] = { total: 0, revenue: 0 }
            }
            productSales[item.name].total += item.quantity || 0
            productSales[item.name].revenue += (item.price || 0) * (item.quantity || 0)
          })
        }
      })
      
      const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({ name, total: data.total, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      // Ventas por día
      const salesByDayMap: Record<string, { total: number; count: number }> = {}
      orders?.forEach(order => {
        const date = order.created_at.split('T')[0]
        if (!salesByDayMap[date]) {
          salesByDayMap[date] = { total: 0, count: 0 }
        }
        salesByDayMap[date].total += order.total || 0
        salesByDayMap[date].count += 1
      })
      
      const salesByDay = Object.entries(salesByDayMap)
        .map(([date, data]) => ({ date, total: data.total, count: data.count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Ventas por método de pago
      const paymentMap: Record<string, { total: number; count: number }> = {}
      orders?.forEach(order => {
        const method = order.payment_method || 'desconocido'
        if (!paymentMap[method]) {
          paymentMap[method] = { total: 0, count: 0 }
        }
        paymentMap[method].total += order.total || 0
        paymentMap[method].count += 1
      })
      
      const paymentMethods = Object.entries(paymentMap)
        .map(([method, data]) => ({ 
          method: method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : method === 'transfer' ? 'Transferencia' : method,
          total: data.total,
          count: data.count 
        }))

      setReport({
        totalSales,
        totalOrders,
        avgTicket,
        topProducts,
        salesByDay,
        salesByCategory: [],
        paymentMethods,
      })
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('Error al cargar reportes')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (reportType === 'ventas') {
      const headers = ['Fecha', 'Total Ventas', 'N° Pedidos', 'Ticket Promedio']
      const rows = report.salesByDay.map(day => [
        day.date,
        `Q${day.total.toFixed(2)}`,
        day.count.toString(),
        `Q${(day.total / day.count).toFixed(2)}`
      ])
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
      downloadFile(csvContent, `reporte_ventas_${dateRange.start}_${dateRange.end}.csv`, 'text/csv')
    } else if (reportType === 'productos') {
      const headers = ['Producto', 'Unidades Vendidas', 'Ingresos']
      const rows = report.topProducts.map(p => [p.name, p.total.toString(), `Q${p.revenue.toFixed(2)}`])
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
      downloadFile(csvContent, `reporte_productos_${dateRange.start}_${dateRange.end}.csv`, 'text/csv')
    } else if (reportType === 'pagos') {
      const headers = ['Método de Pago', 'Total', 'N° Transacciones']
      const rows = report.paymentMethods.map(p => [p.method, `Q${p.total.toFixed(2)}`, p.count.toString()])
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
      downloadFile(csvContent, `reporte_pagos_${dateRange.start}_${dateRange.end}.csv`, 'text/csv')
    }
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Reporte exportado: ${filename}`)
  }

  const printReport = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const title = reportType === 'ventas' ? 'Reporte de Ventas' : reportType === 'productos' ? 'Productos más Vendidos' : 'Reporte de Pagos'
    
    let content = `
      <html>
      <head>
        <title>${title} - Florece</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1B4332; }
          h2 { color: #2D6A4F; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1B4332; color: white; }
          .total { font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>🌵 Florece - Cactus y Suculentas</h1>
        <h2>${title}</h2>
        <p>Período: ${dateRange.start} al ${dateRange.end}</p>
    `
    
    if (reportType === 'ventas') {
      content += `
        <table>
          <thead><tr><th>Fecha</th><th>Total Ventas</th><th>N° Pedidos</th><th>Ticket Promedio</th></tr></thead>
          <tbody>
            ${report.salesByDay.map(day => `
              <tr>
                <td>${day.date}</td>
                <td>Q${day.total.toFixed(2)}</td>
                <td>${day.count}</td>
                <td>Q${(day.total / day.count).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          <p>Total Ventas: Q${report.totalSales.toFixed(2)}</p>
          <p>Total Pedidos: ${report.totalOrders}</p>
          <p>Ticket Promedio: Q${report.avgTicket.toFixed(2)}</p>
        </div>
      `
    } else if (reportType === 'productos') {
      content += `
        <table>
          <thead><tr><th>Producto</th><th>Unidades Vendidas</th><th>Ingresos</th></tr></thead>
          <tbody>
            ${report.topProducts.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.total}</td>
                <td>Q${p.revenue.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    } else if (reportType === 'pagos') {
      content += `
        <table>
          <thead><tr><th>Método de Pago</th><th>Total</th><th>Transacciones</th></tr></thead>
          <tbody>
            ${report.paymentMethods.map(p => `
              <tr>
                <td>${p.method}</td>
                <td>Q${p.total.toFixed(2)}</td>
                <td>${p.count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    }
    
    content += `
        <div class="footer">
          <p>"Dios hace florecer el desierto. Isaías 35:1"</p>
          <p>Florece - Cactus y Suculentas • Guatemala</p>
          <p>Reporte generado el ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Reportes Financieros</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Análisis de ventas y rendimiento</p>
        </div>
        <div className="flex gap-3">
          <button onClick={printReport} className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition flex items-center gap-2">
            🖨️ Imprimir
          </button>
          <button onClick={exportToCSV} className="bg-[#1B4332] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition flex items-center gap-2">
            📥 Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-[#6B6B6B] mb-1">Tipo de reporte</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="p-2 border border-gray-200 rounded-lg"
            >
              <option value="ventas">Reporte de Ventas</option>
              <option value="productos">Productos más Vendidos</option>
              <option value="pagos">Métodos de Pago</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#6B6B6B] mb-1">Desde</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="p-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-[#6B6B6B] mb-1">Hasta</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="p-2 border border-gray-200 rounded-lg"
            />
          </div>
          <button
            onClick={fetchReport}
            className="bg-[#E76F51] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#1B4332]">
          <p className="text-[#6B6B6B] text-sm">Ventas Totales</p>
          <p className="text-2xl font-bold text-[#1B4332]">Q{report.totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#E76F51]">
          <p className="text-[#6B6B6B] text-sm">N° Pedidos</p>
          <p className="text-2xl font-bold text-[#E76F51]">{report.totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#2D6A4F]">
          <p className="text-[#6B6B6B] text-sm">Ticket Promedio</p>
          <p className="text-2xl font-bold text-[#2D6A4F]">Q{report.avgTicket.toFixed(2)}</p>
        </div>
      </div>

      {/* Contenido según tipo de reporte */}
      {reportType === 'ventas' && (
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-5 border-b border-[#E9D8A6]">
            <h2 className="font-semibold text-[#1B4332] text-lg">📊 Ventas por Día</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Total Ventas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">N° Pedidos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Ticket Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.salesByDay.map((day) => (
                  <tr key={day.date} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{day.date}</td>
                    <td className="px-6 py-4 font-medium text-[#1B4332]">Q{day.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">{day.count}</td>
                    <td className="px-6 py-4 text-sm">Q{(day.total / day.count).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'productos' && (
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-5 border-b border-[#E9D8A6]">
            <h2 className="font-semibold text-[#1B4332] text-lg">🏆 Top 10 Productos más Vendidos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Unidades</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.topProducts.map((product, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{idx + 1}</td>
                    <td className="px-6 py-4 font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-sm">{product.total}</td>
                    <td className="px-6 py-4 font-medium text-[#1B4332]">Q{product.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'pagos' && (
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-5 border-b border-[#E9D8A6]">
            <h2 className="font-semibold text-[#1B4332] text-lg">💳 Métodos de Pago</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Método</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Transacciones</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.paymentMethods.map((method) => (
                  <tr key={method.method} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{method.method}</td>
                    <td className="px-6 py-4 text-[#1B4332] font-medium">Q{method.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">{method.count}</td>
                    <td className="px-6 py-4 text-sm">Q{(method.total / method.count).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
