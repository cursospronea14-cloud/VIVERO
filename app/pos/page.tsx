'use client'
// Después de fetchUser, agregar:
if (profile?.role !== 'vendedor' && profile?.role !== 'admin') {
  if (profile?.role === 'bodeguero') {
    router.push('/bodega')
  } else if (profile?.role === 'fumigador') {
    router.push('/fumigacion')
  } else {
    router.push('/login')
  }
  return
}


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
  sku: string
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const [employeeRole, setEmployeeRole] = useState('')
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
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Error obteniendo perfil:', error)
          setEmployeeName('Empleado')
        } else if (profile) {
          setEmployeeName(profile.full_name || 'Empleado')
          setEmployeeRole(profile.role || 'vendedor')
        }
      }
    } catch (err) {
      console.error('Error en fetchUser:', err)
      setEmployeeName('Empleado')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    toast.success('Sesión cerrada')
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .order('display_order')
    if (data) setCategories(data)
  }

  async function fetchProducts() {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('id, name, base_price, image_url, sku')
      .eq('is_active', true)

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory)
    }

    const { data } = await query
    if (data) setProducts(data)
    setLoading(false)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const subtotal = getTotal()
  const iva = subtotal * 0.12
  const total = subtotal + iva

  const handlePayment = async (method: 'cash' | 'card' | 'transfer') => {
    if (items.length === 0) {
      toast.error('Agrega productos primero')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Usuario no autenticado')
        return
      }

      // Generar número de pedido único
      const orderNumber = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      
      const { error } = await supabase
        .from('orders')
        .insert({
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
          subtotal: subtotal,
          iva: iva,
          isr: 0,
          total: total,
          payment_method: method,
          sale_type: 'pos',
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
      
      if (error) {
        console.error('Error al guardar venta:', error)
        toast.error('Error al registrar venta: ' + error.message)
      } else {
        toast.success(`Venta registrada - Total: Q${total.toFixed(2)}`)
        clearCart()
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('Error inesperado al registrar venta')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con botón de cerrar sesión */}
      <div className="bg-[#1B4332] text-white sticky top-0 z-10 shadow-lg">
        <div className="px-6 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Punto de Venta</h1>
            <p className="text-sm text-white/70">Atendiendo: {employeeName || 'Cargando...'}</p>
            <p className="text-xs text-white/50 capitalize">Rol: {employeeRole || 'vendedor'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-white/70">Florece - Cactus y Suculentas</p>
              <p className="text-xs text-white/50">{new Date().toLocaleString()}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
            >
              <span>🚪</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-85px)]">
        {/* Panel izquierdo: productos */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="mb-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332] text-lg"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition ${selectedCategory === null ? 'bg-[#1B4332] text-white' : 'bg-white text-[#1B4332] border border-[#1B4332]'}`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition ${selectedCategory === cat.id ? 'bg-[#1B4332] text-white' : 'bg-white text-[#1B4332] border border-[#1B4332]'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332]"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addItem({ id: product.id, name: product.name, price: product.base_price, quantity: 1 })}
                    className="bg-white p-3 rounded-xl shadow hover:shadow-md transition text-left group"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center mb-2 group-hover:bg-[#E9D8A6]/30 transition">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded-full" />
                        ) : (
                          <span className="text-3xl">🌵</span>
                        )}
                      </div>
                      <p className="font-medium text-sm truncate w-full">{product.name}</p>
                      <p className="text-[#1B4332] font-bold text-sm mt-1">Q{product.base_price.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: carrito */}
        <div className="w-96 bg-white border-l flex flex-col shadow-lg">
          <div className="p-4 bg-[#1B4332] text-white">
            <h2 className="font-bold text-lg">Carrito de venta</h2>
            <p className="text-xs text-white/70">{items.length} productos</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl block mb-3">🛒</span>
                <p className="text-gray-400">Carrito vacío</p>
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
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 bg-gray-100 rounded-full">-</button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 bg-gray-100 rounded-full">+</button>
                      <button onClick={() => removeItem(item.id)} className="ml-2 text-red-500 text-lg">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-4 space-y-3 bg-gray-50">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span>Q{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">IVA (12%)</span><span>Q{iva.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>TOTAL</span><span className="text-[#1B4332]">Q{total.toFixed(2)}</span></div>
            <div className="grid grid-cols-3 gap-2 pt-4">
              <button onClick={() => handlePayment('cash')} disabled={items.length === 0} className="bg-[#2D6A4F] text-white py-2 rounded-lg font-semibold text-sm disabled:opacity-50">💵 Efectivo</button>
              <button onClick={() => handlePayment('card')} disabled={items.length === 0} className="bg-[#E76F51] text-white py-2 rounded-lg font-semibold text-sm disabled:opacity-50">💳 Tarjeta</button>
              <button onClick={() => handlePayment('transfer')} disabled={items.length === 0} className="bg-[#1B4332] text-white py-2 rounded-lg font-semibold text-sm disabled:opacity-50">📱 Transferencia</button>
            </div>
            {items.length > 0 && <button onClick={() => clearCart()} className="w-full text-red-500 text-sm py-1 hover:underline">Vaciar carrito</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
