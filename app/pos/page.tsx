'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useCartStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Product {
  id: number
  name: string
  base_price: number
  image_url: string
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const { items, addItem, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const router = useRouter()

  useEffect(() => {
    fetchUser()
    fetchProducts()
  }, [])

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    if (profile) setEmployeeName(profile.full_name || 'Vendedor')
  }

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('id, name, base_price, image_url')
      .eq('is_active', true)
      .limit(20)
    if (data) setProducts(data)
    setLoading(false)
  }

  const total = getTotal()
  const iva = total * 0.12 / 1.12

  const handlePayment = async (method: 'cash' | 'card' | 'transfer') => {
    if (items.length === 0) {
      toast.error('Agrega productos primero')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const orderNumber = `POS-${Date.now()}`

    const { error } = await supabase.from('orders').insert({
      order_number: orderNumber,
      seller_id: user?.id,
      customer_name: 'Cliente de mostrador',
      items: items,
      subtotal: total,
      iva: iva,
      total: total,
      payment_method: method,
      sale_type: 'pos',
      status: 'paid',
    })

    if (error) {
      toast.error('Error al registrar venta')
    } else {
      toast.success(`Venta registrada - Total: Q${total.toFixed(2)}`)
      clearCart()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-[#1B4332] text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Punto de Venta</h1>
          <p className="text-sm">Atendiendo: {employeeName}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded-lg">Cerrar sesión</button>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-70px)]">
        {/* Productos */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => addItem({ id: p.id, name: p.name, price: p.base_price, quantity: 1 })}
                className="bg-white p-3 rounded-xl shadow text-center"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  {p.image_url ? <img src={p.image_url} className="w-12 h-12 rounded-full" /> : <span className="text-3xl">🌵</span>}
                </div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-[#1B4332] font-bold">Q{p.base_price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Carrito */}
        <div className="w-full md:w-96 bg-white border-l flex flex-col">
          <div className="p-4 bg-[#1B4332] text-white">
            <h2 className="font-bold">Carrito</h2>
            <p className="text-xs">{items.length} productos</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Carrito vacío</div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b py-2">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">Q{item.price.toFixed(2)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 bg-gray-100 rounded-full">-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 bg-gray-100 rounded-full">+</button>
                    <button onClick={() => removeItem(item.id)} className="text-red-500">🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t p-4 space-y-2">
            <div className="flex justify-between font-bold"><span>Total</span><span>Q{total.toFixed(2)}</span></div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handlePayment('cash')} className="bg-[#2D6A4F] text-white py-2 rounded-lg">💵 Efectivo</button>
              <button onClick={() => handlePayment('card')} className="bg-[#E76F51] text-white py-2 rounded-lg">💳 Tarjeta</button>
              <button onClick={() => handlePayment('transfer')} className="bg-[#1B4332] text-white py-2 rounded-lg">📱 Transferencia</button>
            </div>
            {items.length > 0 && <button onClick={() => clearCart()} className="w-full text-red-500 text-sm">Vaciar</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
