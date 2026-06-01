export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useCartStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface Product {
  id: number
  name: string
  base_price: number
  image_url: string
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { items, addItem, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, base_price, image_url')
        .eq('is_active', true)
        .order('name')
      
      if (data) setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const subtotal = getTotal()
  const iva = subtotal * 0.12
  const isr = subtotal * 0.05
  const total = subtotal + iva + isr

  const handlePayment = () => {
    if (items.length === 0) {
      toast.error('Agrega productos primero')
      return
    }
    toast.success(`Venta registrada: Q${total.toFixed(2)}`)
    clearCart()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header POS */}
      <div className="bg-agave text-white p-4">
        <h1 className="text-xl font-bold">Punto de Venta - Florece</h1>
        <p className="text-sm text-arena">POS para empleados</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo: productos */}
        <div className="flex-1 flex flex-col p-4">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4 text-lg"
            autoFocus
          />

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">Cargando...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addItem({
                      id: product.id,
                      name: product.name,
                      price: product.base_price,
                      quantity: 1,
                    })}
                    className="bg-white p-3 rounded-lg shadow hover:shadow-md transition text-left"
                  >
                    <div className="text-2xl mb-1">🌵</div>
                    <div className="font-semibold text-sm truncate">{product.name}</div>
                    <div className="text-agave font-bold">Q{product.base_price.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: carrito */}
        <div className="w-96 bg-white border-l flex flex-col">
          <div className="p-4 border-b bg-agave text-white">
            <h2 className="font-bold">Carrito de venta</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Sin productos</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">Q{item.price.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-2 text-red-500"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Q{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>IVA 12%</span>
              <span>Q{iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>ISR 5%</span>
              <span>Q{isr.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>TOTAL</span>
              <span className="text-flor">Q{total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button className="bg-gray-300 py-3 rounded-lg font-semibold">
                Efectivo
              </button>
              <button className="bg-gray-300 py-3 rounded-lg font-semibold">
                Tarjeta
              </button>
            </div>

            <button
              onClick={handlePayment}
              disabled={items.length === 0}
              className="w-full bg-flor text-white py-3 rounded-lg font-semibold mt-2 disabled:opacity-50"
            >
              Cobrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
