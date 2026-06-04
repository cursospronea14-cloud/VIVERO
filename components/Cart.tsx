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
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    nit: '',
    business_name: '',
    billing_address: '',
  })
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)

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
      // Generar número de pedido único
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      
      // Obtener el usuario actual (si está logueado)
      const { data: { user } } = await supabase.auth.getUser()
      
      // Preparar datos del pedido
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

      // Guardar en la base de datos
      const { error } = await supabase
        .from('orders')
        .insert([orderData])

      if (error) {
        console.error('Error al guardar pedido:', error)
        toast.error('Error al procesar el pedido. Intenta de nuevo.')
        setLoading(false)
        return
      }

      // Construir mensaje de WhatsApp
      const messageItems = items.map(item => 
        `- ${item.name} x${item.quantity} = Q${(item.price * item.quantity).toFixed(2)}`
      ).join('\n')
      
      const totalText = `Subtotal: Q${subtotal.toFixed(2)}\nIVA 12%: Q${iva.toFixed(2)}\nISR 5%: Q${isr.toFixed(2)}\nTOTAL: Q${total.toFixed(2)}`
      
      const customerInfo = `\n\n--- DATOS DEL CLIENTE ---\nNombre: ${customerData.name}\nTeléfono: ${customerData.phone || 'No especificado'}\nNIT: ${customerData.nit || 'Consumidor final'}`
      
      const whatsappUrl = `https://wa.me/50212345678?text=${encodeURIComponent(
        `🌵 *FLORECE - CACTUS Y SUCULENTAS* 🌵\n\n📋 *NUEVO PEDIDO* #${orderNumber}\n\n🛒 *Productos:*\n${messageItems}\n\n💰 *Totales:*\n${totalText}\n${customerInfo}\n\n📦 *Forma de envío:* ${customerData.billing_address ? 'Envío a domicilio' : 'Retiro en tienda'}\n\n*Dios hace florecer el desierto. Isaías 35:1*`
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
      toast.success(`Pedido #${orderNumber} registrado correctamente`)
      
    } catch (err) {
      console.error('Error:', err)
      toast.error('Error inesperado al procesar el pedido')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-agave text-white">
          <h2 className="text-xl font-bold">Mi Carrito</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gris-suave">
              <p>🛒 Tu carrito está vacío</p>
              <button onClick={onClose} className="mt-4 text-agave underline">
                Seguir comprando
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-agave font-bold">Q{item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-2 text-peligro text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Q{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulario de datos del cliente */}
              <div className="border-t pt-4 mt-2">
                <button
                  onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                  className="text-sm text-agave hover:underline mb-3 flex items-center gap-1"
                >
                  {showInvoiceForm ? '📄 Ocultar datos de facturación' : '📄 Agregar datos de facturación (NIT)'}
                </button>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre completo *"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                  />
                  
                  {showInvoiceForm && (
                    <>
                      <input
                        type="text"
                        placeholder="NIT (para factura)"
                        value={customerData.nit}
                        onChange={(e) => setCustomerData({ ...customerData, nit: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Razón social (empresa)"
                        value={customerData.business_name}
                        onChange={(e) => setCustomerData({ ...customerData, business_name: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Correo para factura electrónica"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <textarea
                        placeholder="Dirección de facturación"
                        value={customerData.billing_address}
                        onChange={(e) => setCustomerData({ ...customerData, billing_address: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
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
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Q{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gris-suave">
              <span>IVA (12%)</span>
              <span>Q{iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gris-suave">
              <span>ISR (5%)</span>
              <span>Q{isr.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-flor">Q{total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading || !customerData.name}
              className="w-full bg-flor hover:bg-opacity-85 text-white py-3 rounded-lg font-semibold transition mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando...' : 'Confirmar pedido por WhatsApp'}
            </button>
            <p className="text-xs text-center text-gray-400 mt-2">
              🔒 Tus datos están seguros. El pedido se enviará por WhatsApp.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
