'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_phone: string
  total: number
  payment_method: string
  sale_type: string
  status: string
  created_at: string
}

export default function AdminVentas() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setOrders(data)
    setLoading(false)
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter)

  const totalVentas = filteredOrders.reduce((sum, o) => sum + o.total, 0)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    shipped: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const statusNames: Record<string, string> = {
    pending: 'Pendiente',
    paid: 'Pagado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  }

  if (loading) return <div className="text-center py-12">Cargando...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gris-texto">Ventas</h1>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="paid">Pagadas</option>
            <option value="delivered">Entregadas</option>
          </select>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gris-suave text-sm">Total de ventas</p>
            <p className="text-2xl font-bold text-agave">Q{totalVentas.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gris-suave text-sm">N° pedidos</p>
            <p className="text-2xl font-bold text-flor">{filteredOrders.length}</p>
          </div>
          <div>
            <p className="text-gris-suave text-sm">Ticket promedio</p>
            <p className="text-2xl font-bold text-exito">
              Q{filteredOrders.length > 0 ? (totalVentas / filteredOrders.length).toFixed(2) : '0'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">N° Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Pago</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="px-6 py-4 font-mono text-sm">{order.order_number}</td>
                  <td className="px-6 py-4">{order.customer_name}</td>
                  <td className="px-6 py-4 font-medium text-agave">Q{order.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm capitalize">{order.payment_method}</td>
                  <td className="px-6 py-4 text-sm capitalize">{order.sale_type === 'online' ? 'Online' : 'POS'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[order.status]}`}>
                      {statusNames[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gris-suave">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-flor">Ver detalles</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles del pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Pedido #{selectedOrder.order_number}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gris-suave">Cliente</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gris-suave">Teléfono</p>
                  <p className="font-medium">{selectedOrder.customer_phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gris-suave">Método de pago</p>
                  <p className="font-medium capitalize">{selectedOrder.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-gris-suave">Tipo de venta</p>
                  <p className="font-medium capitalize">{selectedOrder.sale_type === 'online' ? 'Tienda online' : 'Vivero (POS)'}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gris-suave mb-2">Total</p>
                <p className="text-2xl font-bold text-agave">Q{selectedOrder.total.toFixed(2)}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button className="flex-1 bg-agave text-white py-2 rounded-lg">Marcar como pagado</button>
                <button className="flex-1 bg-flor text-white py-2 rounded-lg">Generar factura</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
