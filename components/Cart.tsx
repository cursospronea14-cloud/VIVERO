'use client'

import { useCartStore } from '@/lib/store'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { useState } from 'react'

interface CartProps {
  isOpen: boolean
  onClose: () => void
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [showInvoiceForm, setShowInvoiceForm] = useState(true) // Mostrar siempre para facturación
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    nit: '',
    business_name: '',
    billing_address: '',
  })

  const total = getTotal() // El total ya incluye IVA
  const ivaCalculado = total * 0.12 / 1.12 // IVA desglosado (lo que se paga al SAT)
  const subtotalSinIVA = total - ivaCalculado

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Agrega productos primero')
      return
    }

    if (!customerData.name) {
      toast.error('Ingresa tu nombre para continuar')
      return
    }

    if (!customerData.email) {
      toast.error('Ingresa tu correo electrónico para recibir la factura')
      return
    }

    setLoading(true)

    try {
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const { data: { user } } = await supabase.auth.getUser()
      
      const orderData = {
        order_number: orderNumber,
        customer_name: customerData.name,
        customer_phone: customerData.phone || null,
        customer_email: customerData.email,
        customer_nit: customerData.nit || null,
        customer_business_name: customerData.business_name || null,
        customer_billing_address: customerData.billing_address || null,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        subtotal: total,
        iva: ivaCalculado,
        isr: 0,
        total: total,
        payment_method: 'pending',
        sale_type: 'online',
        status: 'pending',
        seller_id: user?.id || null,
      }

      const { error } = await supabase.from('orders').insert([orderData])

      if (error) {
        console.error('Error:', error)
        toast.error('Error al procesar el pedido')
        setLoading(false)
        return
      }

      // Construir mensaje de WhatsApp con todos los datos
      const messageItems = items.map(item => 
        `- ${item.name} x${item.quantity} = Q${(item.price * item.quantity).toFixed(2)}`
      ).join('\n')
      
      const totalText = `Subtotal: Q${total.toFixed(2)}\n(IVA 12% incluido)`
      
      const customerInfo = `
\n\n--- DATOS DEL CLIENTE ---
Nombre: ${customerData.name}
Teléfono: ${customerData.phone || 'No especificado'}
Correo: ${customerData.email}
NIT: ${customerData.nit || 'Consumidor final'}
Razón Social: ${customerData.business_name || 'No especifica'}
Dirección: ${customerData.billing_address || 'No especifica'}`

      const pendingPaymentNote = `
\n\n--- INSTRUCCIONES DE PAGO ---
💰 Total a pagar: Q${total.toFixed(2)}
🏦 Transferencia bancaria a nombre: Desierto que Florece
📧 Enviar comprobante a: ventas@desierto-florece.com
⏳ El pedido se procesará al confirmar el pago.`
      
      const whatsappUrl = `https://wa.me/50212345678?text=${encodeURIComponent(
        `🌵 *DESIERTO QUE FLORECE* 🌵\n\n📋 *NUEVO PEDIDO* #${orderNumber}\n\n🛒 *Productos:*\n${messageItems}\n\n💰 *Totales:*\n${totalText}\n${customerInfo}\n${pendingPaymentNote}\n\n*Dios hace florecer el desierto. Isaías 35:1*`
      )}`
      
      window.open(whatsappUrl, '_blank')
      clearCart()
      setCustomerData({
        name: '',
        phone: '',
        email: '',
        nit: '',
        business_name: '',
        billing_address: '',
      })
      onClose()
      
      // Mostrar mensaje de éxito con información de factura
      toast.success(`Pedido #${orderNumber} registrado. Se enviará factura a ${customerData.email}`)
      
    } catch (err) {
      console.error('Error:', err)
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-[#1B4332] text-white">
          <h2 className="text-xl font-bold">Mi Carrito</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>🛒 Tu carrito está vacío</p>
              <button onClick={onClose} className="mt-4 text-[#1B4332] underline">Seguir comprando</button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-[#1B4332] font-bold">Q{item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 bg-gray-200 rounded-full">-</button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 bg-gray-200 rounded-full">+</button>
                        <button onClick={() => removeItem(item.id)} className="ml-2 text-red-500 text-sm">Eliminar</button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Q{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulario de facturación - Siempre visible */}
              <div className="border-t pt-4">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-[#1B4332]">📄 Datos para facturación</p>
                  <p className="text-xs text-gray-500">Completa tus datos para recibir la factura por correo</p>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre completo *"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono *"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Correo electrónico * (para factura)"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="NIT (opcional, para factura)"
                    value={customerData.nit}
                    onChange={(e) => setCustomerData({ ...customerData, nit: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Razón social (opcional)"
                    value={customerData.business_name}
                    onChange={(e) => setCustomerData({ ...customerData, business_name: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                  <textarea
                    placeholder="Dirección de envío *"
                    value={customerData.billing_address}
                    onChange={(e) => setCustomerData({ ...customerData, billing_address: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm"
                    rows={2}
                    required
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-2 bg-gray-50">
            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-bold text-[#1B4332] text-xl">Q{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>IVA 12% incluido</span>
              <span>Q{ivaCalculado.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading || !customerData.name || !customerData.email || !customerData.billing_address}
              className="w-full bg-[#E76F51] text-white py-3 rounded-lg font-semibold mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando...' : 'Confirmar pedido por WhatsApp'}
            </button>
            <p className="text-xs text-center text-gray-400 mt-2">
              🔒 Al confirmar, recibirás la factura en tu correo electrónico
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
