'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_nit: string
  customer_business_name: string
  total: number
  created_at: string
  status: string
}

export default function AdminFacturas() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_nit, customer_business_name, total, created_at, status')
      .not('customer_nit', 'is', null)
      .order('created_at', { ascending: false })
    
    if (data) setOrders(data)
    setLoading(false)
  }

  const generateInvoice = (order: Order) => {
    const invoiceWindow = window.open('', '_blank')
    if (!invoiceWindow) return
    
    invoiceWindow.document.write(`
      <html>
      <head>
        <title>Factura - Florece</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #1B4332; padding-bottom: 20px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #1B4332; }
          .invoice-details { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #1B4332; color: white; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">🌵 FLORECE</div>
          <div>Cactus y Suculentas</div>
          <div>"Dios hace florecer el desierto. Isaías 35:1"</div>
        </div>
        <div class="invoice-details">
          <p><strong>Factura N°:</strong> ${order.order_number}</p>
          <p><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Cliente:</strong> ${order.customer_name}</p>
          <p><strong>NIT:</strong> ${order.customer_nit || 'Consumidor final'}</p>
          <p><strong>Razón Social:</strong> ${order.customer_business_name || '-'}</p>
        </div>
        <table>
          <thead><tr><th>Descripción</th><th>Cantidad</th><th>Precio Unitario</th><th>Subtotal</th></tr></thead>
          <tbody><tr><td colspan="4" style="text-align:center">Productos registrados en el sistema</td></tr></tbody>
        </table>
        <div class="total">
          <p>Total a pagar: Q${order.total?.toFixed(2) || '0.00'}</p>
        </div>
        <div class="footer">
          <p>¡Gracias por su compra!</p>
          <p>Florece - Cactus y Suculentas • Guatemala</p>
        </div>
      </body>
      </html>
    `)
    invoiceWindow.document.close()
    invoiceWindow.print()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332]"></div></div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B4332]">Facturación</h1>
        <p className="text-gray-500 text-sm">Pedidos que requieren factura con NIT</p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Pedido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm">{order.order_number}</td>
                <td className="px-6 py-4">{order.customer_name}</td>
                <td className="px-6 py-4 text-sm">{order.customer_nit}</td>
                <td className="px-6 py-4 font-medium text-[#1B4332]">Q{order.total?.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button onClick={() => generateInvoice(order)} className="text-[#1B4332] hover:underline text-sm">
                    🖨️ Generar factura
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="p-8 text-center text-gray-500">No hay pedidos que requieran factura</div>
        )}
      </div>
    </div>
  )
}
