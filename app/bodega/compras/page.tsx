'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Supplier {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  sku: string
}

export default function ComprasPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [recentPurchases, setRecentPurchases] = useState<any[]>([])
  const [formData, setFormData] = useState({
    supplier_id: 0,
    product_id: 0,
    quantity: 0,
    unit_cost: 0,
    invoice_number: '',
    expiry_date: '',
    barcode: '',
  })
  const router = useRouter()

  useEffect(() => {
    fetchSuppliers()
    fetchProducts()
    fetchRecentPurchases()
  }, [])

  async function fetchSuppliers() {
    const { data } = await supabase.from('suppliers').select('id, name').eq('is_active', true)
    if (data) setSuppliers(data)
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('id, name, sku').eq('is_active', true)
    if (data) setProducts(data)
  }

  async function fetchRecentPurchases() {
    const { data } = await supabase
      .from('purchase_lots')
      .select(`
        id,
        quantity,
        unit_cost,
        invoice_number,
        received_at,
        suppliers (name),
        products (name)
      `)
      .order('received_at', { ascending: false })
      .limit(5)
    if (data) setRecentPurchases(data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      toast.error('Usuario no autenticado')
      return
    }
    
    // 1. Registrar la compra
    const { error: purchaseError } = await supabase
      .from('purchase_lots')
      .insert({
        supplier_id: formData.supplier_id,
        product_id: formData.product_id,
        branch_id: 1,
        quantity: formData.quantity,
        unit_cost: formData.unit_cost,
        invoice_number: formData.invoice_number,
        expiry_date: formData.expiry_date || null,
        received_at: new Date().toISOString().split('T')[0],
        created_by: user.id,
      })
    
    if (purchaseError) {
      toast.error('Error al registrar compra: ' + purchaseError.message)
      return
    }
    
    // 2. Actualizar stock
    const { data: existingStock } = await supabase
      .from('branch_stock')
      .select('quantity')
      .eq('product_id', formData.product_id)
      .eq('branch_id', 1)
      .single()
    
    if (existingStock) {
      await supabase
        .from('branch_stock')
        .update({ quantity: existingStock.quantity + formData.quantity })
        .eq('product_id', formData.product_id)
        .eq('branch_id', 1)
    } else {
      await supabase
        .from('branch_stock')
        .insert({
          product_id: formData.product_id,
          branch_id: 1,
          quantity: formData.quantity,
        })
    }
    
    // 3. Actualizar código de barras y precio de compra
    const updateData: any = { purchase_price: formData.unit_cost }
    if (formData.barcode) {
      updateData.barcode = formData.barcode
    }
    
    await supabase
      .from('products')
      .update(updateData)
      .eq('id', formData.product_id)
    
    toast.success('Compra registrada y stock actualizado')
    
    setFormData({
      supplier_id: 0,
      product_id: 0,
      quantity: 0,
      unit_cost: 0,
      invoice_number: '',
      expiry_date: '',
      barcode: '',
    })
    
    fetchRecentPurchases()
    fetchProducts()
  }

  async function handleLogout() {
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
      <header className="bg-[#1B4332] text-white shadow-lg">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Registro de Compras</h1>
            <p className="text-sm text-white/70">Bodega - Recepción de productos</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-[#1B4332] mb-6">📦 Registrar entrada de productos</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Proveedor *</label>
                <select
                  required
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value={0}>Seleccionar proveedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Producto *</label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value={0}>Seleccionar producto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku || 'Sin SKU'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cantidad *</label>
                <input
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Precio de compra (GTQ) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">N° Factura</label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Código de barras</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                  placeholder="Escanear o ingresar código"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fecha de vencimiento (si aplica)</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full p-2 border rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-semibold hover:bg-[#2D6A4F] transition"
            >
              Registrar compra y actualizar stock
            </button>
          </form>
        </div>

        {/* Compras recientes */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-[#1B4332]">📋 Compras recientes</h2>
          </div>
          <div className="divide-y">
            {recentPurchases.map((purchase) => (
              <div key={purchase.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{purchase.products?.name}</p>
                  <p className="text-sm text-gray-500">Proveedor: {purchase.suppliers?.name}</p>
                  <p className="text-xs text-gray-400">Factura: {purchase.invoice_number || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#1B4332]">{purchase.quantity} unidades</p>
                  <p className="text-sm">Q{purchase.unit_cost?.toFixed(2)} c/u</p>
                  <p className="text-xs text-gray-400">{new Date(purchase.received_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
