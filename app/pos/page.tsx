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
  sku: string
  barcode: string
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const [employeeRole, setEmployeeRole] = useState('')
  const [showCashModal, setShowCashModal] = useState(false)
  const [cashAmount, setCashAmount] = useState(0)
  const [change, setChange] = useState(0)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'transfer' | null>(null)
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

  useEffect(() => {
    const subtotal = getTotal()
    const iva = subtotal * 0.12
    const total = subtotal + iva
    setChange(Math.max(0, cashAmount - total))
  }, [cashAmount, getTotal])

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
    if (profile) {
      setEmployeeName(profile.full_name || 'Empleado')
      setEmployeeRole(profile.role || 'vendedor')
      if (profile.role === 'bodeguero') router.push('/bodega')
      if (profile.role === 'fumigador') router.push('/fumigacion')
      if (profile.role === 'admin') router.push('/admin')
    }
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('id, name').order('display_order')
    if (data) setCategories(data)
  }

  async function fetchProducts() {
    setLoading(true)
    let query = supabase.from('products').select('id, name, base_price, image_url, sku, barcode').eq('is_active', true)
    if (selectedCategory) query = query.eq('category_id', selectedCategory)
    const { data } = await query
    if (data) setProducts(data)
    setLoading(false)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  )

  const subtotal = getTotal()
  const iva = subtotal * 0.12
  const total = subtotal + iva

  const openCashModal = (method: 'cash' | 'card' | 'transfer') => {
    if (items.length === 0) { toast.error('Agrega productos primero'); return }
    if (method === 'cash') { setSelectedPaymentMethod('cash'); setCashAmount(total); setChange(0); setShowCashModal(true) }
    else processPayment(method, total, 0)
  }

  const processPayment = async (method: 'cash' | 'card' | 'transfer', amountPaid: number, changeAmount: number = 0) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Usuario no autenticado'); return }
    const orderNumber = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const { error } = await supabase.from('orders').insert({
      order_number: orderNumber, branch_id: 1, seller_id: user.id, customer_name: 'Cliente de mostrador',
      items: items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
      subtotal, iva, isr: 0, total, payment_method: method, sale_type: 'pos', status: 'paid', paid_at: new Date().toISOString()
    })
    if (error) toast.error('Error al registrar venta')
    else {
      if (method === 'cash' && changeAmount > 0) toast.success(`Venta registrada - Total: Q${total.toFixed(2)} | Vuelto: Q${changeAmount.toFixed(2)}`)
      else toast.success(`Venta registrada - Total: Q${total.toFixed(2)}`)
      clearCart(); setShowCashModal(false); setCashAmount(0); setChange(0); setSelectedPaymentMethod(null)
    }
  }

  const handleCashPayment = () => { if (cashAmount < total) toast.error(`Monto insuficiente. Total: Q${total.toFixed(2)}`); else processPayment('cash', cashAmount, change) }

  const printTicket = () => {
    const ticketWindow = window.open('', '_blank')
    if (!ticketWindow) return
    ticketWindow.document.write(`<html><head><title>Ticket de Venta</title><style>body{font-family:monospace;font-size:12px;padding:20px;width:300px;margin:0 auto}.header{text-align:center;border-bottom:1px dashed #000;padding-bottom:10px;margin-bottom:10px}.item{display:flex;justify-content:space-between;margin:5px 0}.total{border-top:1px dashed #000;margin-top:10px;padding-top:10px}</style></head><body><div class="header"><div class="title">🌵 FLORECE</div><div>Cactus y Suculentas</div><div>"Dios hace florecer el desierto"</div></div><div>Fecha: ${new Date().toLocaleString()}</div><div>Atendió: ${employeeName}</div><div>--------------------------------</div>${items.map(item => `<div class="item"><span>${item.name} x${item.quantity}</span><span>Q${(item.price * item.quantity).toFixed(2)}</span></div>`).join('')}<div>--------------------------------</div><div class="item"><span>Subtotal:</span><span>Q${subtotal.toFixed(2)}</span></div><div class="item"><span>IVA (12%):</span><span>Q${iva.toFixed(2)}</span></div><div class="total"><div class="item"><strong>TOTAL:</strong><strong>Q${total.toFixed(2)}</strong></div></div>${selectedPaymentMethod === 'cash' && cashAmount > 0 ? `<div class="item"><span>Efectivo:</span><span>Q${cashAmount.toFixed(2)}</span></div><div class="item"><span>Vuelto:</span><span>Q${change.toFixed(2)}</span></div>` : ''}<div class="footer"><p>¡Gracias por su compra!</p></div></body></html>`)
    ticketWindow.document.close(); ticketWindow.print()
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332]"></div></div>

  const subtotalDisplay = getTotal()
  const ivaDisplay = subtotalDisplay * 0.12
  const totalDisplay = subtotalDisplay + ivaDisplay

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-[#1B4332] text-white sticky top-0 z-10 shadow-lg">
        <div className="px-6 py-3 flex justify-between items-center">
          <div><h1 className="text-xl font-bold">Punto de Venta</h1><p className="text-sm text-white/70">Atendiendo: {employeeName}</p><p className="text-xs text-white/50">{employeeRole}</p></div>
          <div className="flex items-center gap-4"><div className="text-right"><p className="text-sm text-white/70">Florece</p><p className="text-xs">{new Date().toLocaleString()}</p></div><button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm">Cerrar sesión</button></div>
        </div>
      </div>
      <div className="flex h-[calc(100vh-85px)]">
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="mb-4 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span><input type="text" placeholder="Buscar por nombre, SKU o código de barras..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1B4332]" autoFocus /></div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2"><button onClick={() => setSelectedCategory(null)} className={`px-4 py-1.5 rounded-full text-sm ${selectedCategory === null ? 'bg-[#1B4332] text-white' : 'bg-white text-[#1B4332] border'}`}>Todos</button>{categories.map(cat => <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-1.5 rounded-full text-sm ${selectedCategory === cat.id ? 'bg-[#1B4332] text-white' : 'bg-white text-[#1B4332] border'}`}>{cat.name}</button>)}</div>
          <div className="flex-1 overflow-y-auto"><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">{filteredProducts.map(p => <button key={p.id} onClick={() => addItem({ id: p.id, name: p.name, price: p.base_price, quantity: 1 })} className="bg-white p-3 rounded-xl shadow hover:shadow-md text-center"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">{p.image_url ? <img src={p.image_url} className="w-12 h-12 object-cover rounded-full" /> : <span className="text-3xl">🌵</span>}</div><p className="font-medium text-sm truncate">{p.name}</p><p className="text-[#1B4332] font-bold">Q{p.base_price.toFixed(2)}</p>{p.barcode && <p className="text-xs text-gray-400">{p.barcode}</p>}</button>)}</div></div>
        </div>
        <div className="w-96 bg-white border-l flex flex-col shadow-lg">
          <div className="p-4 bg-[#1B4332] text-white"><h2 className="font-bold">Carrito</h2><p className="text-xs">{items.length} productos</p></div>
          <div className="flex-1 overflow-y-auto p-4">{items.length === 0 ? <div className="text-center py-12"><span className="text-5xl">🛒</span><p className="text-gray-400">Carrito vacío</p></div> : <div className="space-y-3">{items.map(item => <div key={item.id} className="flex justify-between items-center border-b pb-3"><div><p className="font-medium">{item.name}</p><p className="text-xs text-gray-500">Q{item.price.toFixed(2)} c/u</p></div><div className="flex items-center gap-2"><button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 bg-gray-100 rounded-full">-</button><span className="w-8 text-center">{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 bg-gray-100 rounded-full">+</button><button onClick={() => removeItem(item.id)} className="text-red-500">🗑️</button></div></div>)}</div>}</div>
          <div className="border-t p-4 space-y-3 bg-gray-50">
            <div className="flex justify-between"><span>Subtotal</span><span>Q{subtotalDisplay.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>IVA (12%)</span><span>Q{ivaDisplay.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>TOTAL</span><span className="text-[#1B4332]">Q{totalDisplay.toFixed(2)}</span></div>
            <div className="grid grid-cols-3 gap-2 pt-4"><button onClick={() => openCashModal('cash')} disabled={items.length === 0} className="bg-[#2D6A4F] text-white py-2 rounded-lg font-semibold text-sm disabled:opacity-50">💵 Efectivo</button><button onClick={() => openCashModal('card')} disabled={items.length === 0} className="bg-[#E76F51] text-white py-2 rounded-lg disabled:opacity-50">💳 Tarjeta</button><button onClick={() => openCashModal('transfer')} disabled={items.length === 0} className="bg-[#1B4332] text-white py-2 rounded-lg disabled:opacity-50">📱 Transferencia</button></div>
            {items.length > 0 && <><button onClick={() => clearCart()} className="w-full text-red-500 text-sm">Vaciar carrito</button><button onClick={printTicket} className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg text-sm">🖨️ Imprimir ticket</button></>}
          </div>
        </div>
      </div>
      {showCashModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-2xl shadow-xl w-full max-w-md"><div className="p-5 border-b flex justify-between"><h2 className="text-xl font-bold">Pago en Efectivo</h2><button onClick={() => setShowCashModal(false)} className="text-2xl">&times;</button></div><div className="p-5 space-y-4"><div className="bg-gray-100 p-4 rounded-xl text-center"><p className="text-sm text-gray-600">Total a pagar</p><p className="text-3xl font-bold text-[#1B4332]">Q{totalDisplay.toFixed(2)}</p></div><div><label className="block text-sm mb-1">Monto recibido</label><input type="number" step="1" value={cashAmount} onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)} className="w-full p-3 border rounded-xl text-lg" autoFocus /></div>{cashAmount >= totalDisplay && <div className="bg-green-50 p-4 rounded-xl"><div className="flex justify-between"><span>Vuelto:</span><span className="text-2xl font-bold text-green-600">Q{change.toFixed(2)}</span></div></div>}{cashAmount < totalDisplay && cashAmount > 0 && <div className="bg-red-50 p-4 rounded-xl"><p className="text-red-600">Faltan Q{(totalDisplay - cashAmount).toFixed(2)}</p></div>}<div className="flex gap-3 pt-4"><button onClick={() => setShowCashModal(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancelar</button><button onClick={handleCashPayment} disabled={cashAmount < totalDisplay} className="flex-1 px-4 py-2 bg-[#1B4332] text-white rounded-xl">Cobrar</button></div></div></div></div>}
    </div>
  )
}
