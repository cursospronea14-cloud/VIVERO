'use client'

import { useCartStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface CartProps {
  isOpen: boolean
  onClose: () => void
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()

  const subtotal = getTotal()
  const iva = subtotal * 0.12
  const isr = subtotal * 0.05
  const total = subtotal + iva + isr

  const handleCheckout = () => {
    const message = items.map(item => 
      `- ${item.name} x${item.quantity} = Q${(item.price * item.quantity).toFixed(2)}`
    ).join('\n')
    
    const totalText = `Subtotal: Q${subtotal.toFixed(2)}\nIVA 12%: Q${iva.toFixed(2)}\nISR 5%: Q${isr.toFixed(2)}\nTOTAL: Q${total.toFixed(2)}`
    
    const whatsappUrl = `https://wa.me/50212345678?text=${encodeURIComponent(
      `🌵 *FLORECE - CACTUS Y SUCULENTAS* 🌵\n\nMis productos:\n${message}\n\n${totalText}\n\n*Dios hace florecer el desierto. Isaías 35:1*`
    )}`
    
    window.open(whatsappUrl, '_blank')
    clearCart()
    onClose()
    toast.success('Pedido enviado por WhatsApp')
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
            <div className="space-y-4">
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
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-2">
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
              className="w-full bg-flor hover:bg-opacity-85 text-white py-3 rounded-lg font-semibold transition mt-4"
            >
              Comprar por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
