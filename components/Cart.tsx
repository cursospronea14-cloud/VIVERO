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
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    nit: '',
    business_name: '',
    billing_address: '',
  })

  const subtotal = getTotal()
  const iva = subtotal * 0.12
  const isr = subtotal * 0.05
  const total = subtotal + iva + isr

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Agrega productos primero')
      return
    }

    if (!customerData.name) {
      toast.error('Ingresa tu nombre para continuar')
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
        customer_email: customerData.email || null,
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
        subtotal: subtotal,
        iva: iva,
        isr: isr,
        total: total,
        payment_method: 'transfer',
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

      const messageItems = items.map(item => 
        `- ${item.name} x${item.quantity} = Q${(item.price * item.quantity).toFixed(2)}`
      ).join('\n')
      
      const totalText = `Subtotal: Q${subtotal.toFixed(2)}\nIVA 12%: Q${iva.toFixed(2)}\nISR 5%: Q${isr.toFixed(2)}\nTOTAL: Q${total.toFixed(2)}`
      
      const customerInfo = `\n\n--- DATOS DEL CLIENTE ---\nNombre: ${customerData.name}\nTeléfono: ${customerData.phone || 'No especificado'}\nNIT: ${customerData.nit || 'Consumidor final'}`
      
      const whatsappUrl = `https://wa.me/50212345678?text=${encodeURIComponent(
        `🌵 *FLORECE - CACTUS Y SUCULENTAS* 🌵\n\n📋 *NUEVO PEDIDO* #${orderNumber}\n\n🛒 *Productos:*\n${messageItems}\n\n💰 *Totales:*\n${totalText}\n${customerInfo}\n\n*Dios hace florecer el desierto. Isaías 35:1*`
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
      setShowInvoiceForm(false)
      onClose()
      toast.success(`Pedido #${orderNumber} registrado`)
      
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

              {/* Formulario de facturación */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                  className="text-sm text-[#1B4332] hover:underline mb-3"
                >
                  {showInvoiceForm ? '📄 Ocultar facturación' : '📄 Agregar datos de facturación (NIT)'}
                </button>
                
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
                    placeholder="Teléfono"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                  
                  {showInvoiceForm && (
                    <>
                      <input
                        type="text"
                        placeholder="NIT (para factura)"
                        value={customerData.nit}
                        onChange={(e) => setCustomerData({ ...customerData, nit: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Razón social"
                        value={customerData.business_name}
                        onChange={(e) => setCustomerData({ ...customerData, business_name: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Correo para factura"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                      />
                      <textarea
                        placeholder="Dirección de facturación"
                        value={customerData.billing_address}
                        onChange={(e) => setCustomerData({ ...customerData, billing_address: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                        rows={2}
                      />
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-2 bg-gray-50">
            <div className="flex justify-between"><span>Subtotal</span><span>Q{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-gray-500"><span>IVA (12%)</span><span>Q{iva.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-gray-500"><span>ISR (5%)</span><span>Q{isr.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span className="text-[#E76F51]">Q{total.toFixed(2)}</span></div>
            <button
              onClick={handleCheckout}
              disabled={loading || !customerData.name}
              className="w-full bg-[#E76F51] text-white py-3 rounded-lg font-semibold mt-4 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Confirmar pedido por WhatsApp'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
