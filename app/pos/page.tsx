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
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const [showCashModal, setShowCashModal] = useState(false)
  const [cashAmount, setCashAmount] = useState(0)
  const [change, setChange] = useState(0)
  const { items, addItem, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const router = useRouter()

  useEffect(() => {
    fetchUser()
    fetchCategories()
    fetchProducts()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()
    if (profile) {
      setEmployeeName(profile.full_name || 'Vendedor')
      if (profile.role === 'admin') router.push('/admin')
      if (profile.role === 'bodeguero') router.push('/bodega')
      if (profile.role === 'fumigador') router.push('/fumigacion')
    }
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('id, name').order('display_order')
    if (data) setCategories(data)
  }

  async function fetchProducts() {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('id, name, base_price, image_url')
      .eq('is_active', true)

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory)
    }

    const { data } = await query
    if (data) setProducts(data)
    setLoading(false)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const total = getTotal()
  const iva = total * 0.12 / 1.12

  const processPayment = async (method: string, cashPaid?: number) => {
    if (items.length === 0) {
      toast.error('Agrega productos primero')
      return false
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Usuario no autenticado')
        return false
      }

      const orderNumber = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      
      const { error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        branch_id: 1,
        seller_id: user.id,
        customer_name: 'Cliente de mostrador',
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: total,
        iva: iva,
        total: total,
        payment_method: method,
        sale_type: 'pos',
        status: 'paid',
        paid_at: new Date().toISOString(),
      })

      if (error) {
        toast.error('Error al registrar venta: ' + error.message)
        return false
      }

      if (method === 'cash' && cashPaid && cashPaid > total) {
        const vuelto = cashPaid - total
        toast.success(`Venta registrada - Total: Q${total.toFixed(2)} | Vuelto: Q${vuelto.toFixed(2)}`)
      } else {
        toast.success(`Venta registrada - Total: Q${total.toFixed(2)}`)
      }
      
      clearCart()
      return true
    } catch (err) {
      toast.error('Error inesperado')
      return false
    }
  }

  const handleCashPayment = async () => {
    if (cashAmount < total) {
      toast.error(`Monto insuficiente. Total: Q${total.toFixed(2)}`)
      return
    }
    setShowCashModal(false)
    await processPayment('cash', cashAmount)
    setCashAmount(0)
    setChange(0)
  }

  const handleCardPayment = async () => {
    await processPayment('card')
  }

  const handleTransferPayment = async () => {
    await processPayment('transfer')
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
      {/* Header */}
      <div className="bg-[#1B4332] text-white sticky top-0 z-10 shadow-lg">
        <div className="px-6 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Punto de Venta</h1>
            <p className="text-sm text-white/70">Atendiendo: {employeeName || 'Empleado'}</p>
          </div>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-70px)]">
        {/* Panel izquierdo - Productos */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          {/* Buscador */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          {/* Categorías */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                selectedCategory === null
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-white text-[#1B4332] border border-[#1B4332]'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-[#1B4332] text-white'
                    : 'bg-white text-[#1B4332] border border-[#1B4332]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grid de productos */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addItem({ id: product.id, name: product.name, price: product.base_price, quantity: 1 })}
                  className="bg-white p-3 rounded-xl shadow hover:shadow-md transition text-center"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl">🌵</span>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-[#1B4332] font-bold text-sm">Q{product.base_price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel derecho - Carrito */}
        <div className="w-full lg:w-96 bg-white border-l flex flex-col shadow-lg">
          <div className="p-4 bg-[#1B4332] text-white">
            <h2 className="font-bold text-lg">Carrito de venta</h2>
            <p className="text-xs text-white/70">{items.length} productos</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl block mb-3">🛒</span>
                <p className="text-gray-400">Carrito vacío</p>
                <p className="text-xs text-gray-400 mt-1">Agrega productos para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">Q{item.price.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-2 text-red-500 text-lg hover:text-red-700 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-4 space-y-3 bg-gray-50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">Q{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>IVA (12% incluido)</span>
              <span>Q{iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>TOTAL</span>
              <span className="text-[#1B4332]">Q{total.toFixed(2)}</span>
            </div>

            {items.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-4">
                <button
                  onClick={() => setShowCashModal(true)}
                  className="bg-[#2D6A4F] text-white py-2 rounded-lg font-semibold text-sm hover:bg-opacity-90 transition"
                >
                  💵 Efectivo
                </button>
                <button
                  onClick={handleCardPayment}
                  className="bg-[#E76F51] text-white py-2 rounded-lg font-semibold text-sm hover:bg-opacity-90 transition"
                >
                  💳 Tarjeta
                </button>
                <button
                  onClick={handleTransferPayment}
                  className="bg-[#1B4332] text-white py-2 rounded-lg font-semibold text-sm hover:bg-opacity-90 transition"
                >
                  📱 Transferencia
                </button>
              </div>
            )}
            
            {items.length > 0 && (
              <button
                onClick={() => clearCart()}
                className="w-full text-red-500 text-sm py-2 hover:underline transition"
              >
                Vaciar carrito
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de pago en efectivo */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1B4332]">Pago en Efectivo</h2>
              <button onClick={() => setShowCashModal(false)} className="text-2xl text-gray-500 hover:text-[#1B4332]">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-100 p-4 rounded-xl text-center">
                <p className="text-sm text-gray-600">Total a pagar</p>
                <p className="text-3xl font-bold text-[#1B4332]">Q{total.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monto recibido</label>
                <input
                  type="number"
                  step="1"
                  value={cashAmount}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0
                    setCashAmount(amount)
                    setChange(Math.max(0, amount - total))
                  }}
                  className="w-full p-3 border border-gray-200 rounded-xl text-lg font-medium"
                  autoFocus
                />
              </div>
              {cashAmount >= total && cashAmount > 0 && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Vuelto:</span>
                    <span className="text-2xl font-bold text-green-600">Q{change.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {cashAmount < total && cashAmount > 0 && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <p className="text-red-600 text-center">Faltan Q{(total - cashAmount).toFixed(2)}</p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowCashModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  onClick={handleCashPayment}
                  disabled={cashAmount < total}
                  className="flex-1 px-4 py-2 bg-[#1B4332] text-white rounded-xl hover:bg-[#2D6A4F] disabled:opacity-50"
                >
                  Cobrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
