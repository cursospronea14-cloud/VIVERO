'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface StockItem {
  branch_id: number
  branch_name: string
  product_id: number
  product_name: string
  quantity: number
  location_code: string
}

interface Branch {
  id: number
  name: string
}

export default function AdminInventario() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<{ id: number; name: string }[]>([])
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingStock, setEditingStock] = useState<{ productId: number; branchId: number; quantity: number } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStock, setNewStock] = useState({ product_id: 0, branch_id: 0, quantity: 0, location_code: '' })

  useEffect(() => {
    fetchBranches()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (branches.length > 0) {
      fetchStock()
    }
  }, [selectedBranch, branches])

  async function fetchBranches() {
    const { data } = await supabase.from('branches').select('id, name').order('name')
    if (data) setBranches(data)
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('id, name').eq('is_active', true).order('name')
    if (data) setProducts(data)
  }

  async function fetchStock() {
    setLoading(true)
    let query = supabase.from('branch_stock').select(`quantity, location_code, branch_id, product_id, products (name)`)
    if (selectedBranch) query = query.eq('branch_id', selectedBranch)
    const { data } = await query
    if (data) {
      const formatted: StockItem[] = data.map((item: any) => ({
        branch_id: item.branch_id,
        branch_name: branches.find(b => b.id === item.branch_id)?.name || '',
        product_id: item.product_id,
        product_name: item.products?.name || '',
        quantity: item.quantity,
        location_code: item.location_code || '',
      }))
      setStock(formatted)
    }
    setLoading(false)
  }

  async function updateStock(productId: number, branchId: number, newQuantity: number) {
    if (newQuantity < 0) { toast.error('La cantidad no puede ser negativa'); return }
    const { error } = await supabase.from('branch_stock').update({ quantity: newQuantity }).eq('product_id', productId).eq('branch_id', branchId)
    if (error) { toast.error('Error al actualizar stock') } else { toast.success('Stock actualizado'); fetchStock(); setEditingStock(null) }
  }

  async function addStock() {
    if (!newStock.product_id || !newStock.branch_id) { toast.error('Selecciona producto y sucursal'); return }
    const { error } = await supabase.from('branch_stock').upsert({ product_id: newStock.product_id, branch_id: newStock.branch_id, quantity: newStock.quantity, location_code: newStock.location_code })
    if (error) { toast.error('Error al agregar stock') } else { toast.success('Stock agregado'); fetchStock(); setShowAddModal(false); setNewStock({ product_id: 0, branch_id: 0, quantity: 0, location_code: '' }) }
  }

  const totalStock = stock.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332]"></div></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold text-[#1B4332]">Inventario</h1><p className="text-[#6B6B6B] text-sm mt-1">Control de stock por sucursal</p></div>
        <div className="flex gap-3">
          <select value={selectedBranch || ''} onChange={(e) => setSelectedBranch(e.target.value ? parseInt(e.target.value) : null)} className="p-2 border border-gray-200 rounded-xl text-sm">
            <option value="">Todas las sucursales</option>
            {branches.map((branch) => (<option key={branch.id} value={branch.id}>{branch.name}</option>))}
          </select>
          <button onClick={() => setShowAddModal(true)} className="bg-[#1B4332] text-white px-4 py-2 rounded-xl hover:bg-[#2D6A4F] transition flex items-center gap-2 text-sm"><span>+</span>Agregar stock</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4"><p className="text-[#6B6B6B] text-xs uppercase tracking-wide">Total productos</p><p className="text-2xl font-bold text-[#1B4332]">{stock.length}</p></div>
        <div className="bg-white rounded-xl shadow-md p-4"><p className="text-[#6B6B6B] text-xs uppercase tracking-wide">Unidades en stock</p><p className="text-2xl font-bold text-[#1B4332]">{totalStock}</p></div>
        <div className="bg-white rounded-xl shadow-md p-4"><p className="text-[#6B6B6B] text-xs uppercase tracking-wide">Sucursales</p><p className="text-2xl font-bold text-[#1B4332]">{branches.length}</p></div>
        <div className="bg-white rounded-xl shadow-md p-4"><p className="text-[#6B6B6B] text-xs uppercase tracking-wide">Stock bajo</p><p className="text-2xl font-bold text-[#E76F51]">{stock.filter(i => i.quantity <= 5).length}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Producto</th><th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Sucursal</th><th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Ubicación</th><th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Cantidad</th><th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Estado</th><th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stock.map((item) => (
                <tr key={`${item.product_id}-${item.branch_id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{item.product_name}</td><td className="px-6 py-4 text-sm">{item.branch_name}</td><td className="px-6 py-4 text-sm text-[#6B6B6B]">{item.location_code || '-'}</td>
                  <td className="px-6 py-4">{editingStock?.productId === item.product_id && editingStock?.branchId === item.branch_id ? (<input type="number" value={editingStock.quantity} onChange={(e) => setEditingStock({ ...editingStock, quantity: parseInt(e.target.value) })} className="w-24 p-1 border rounded-lg" autoFocus />) : (<span className={`font-medium ${item.quantity <= 5 ? 'text-red-600' : 'text-[#1B4332]'}`}>{item.quantity} unidades</span>)}</td>
                  <td className="px-6 py-4">{item.quantity <= 0 ? (<span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Agotado</span>) : item.quantity <= 5 ? (<span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Stock bajo</span>) : (<span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Normal</span>)}</td>
                  <td className="px-6 py-4">{editingStock?.productId === item.product_id && editingStock?.branchId === item.branch_id ? (<div className="flex gap-2"><button onClick={() => updateStock(item.product_id, item.branch_id, editingStock.quantity)} className="text-green-600">✓</button><button onClick={() => setEditingStock(null)} className="text-red-600">✗</button></div>) : (<button onClick={() => setEditingStock({ productId: item.product_id, branchId: item.branch_id, quantity: item.quantity })} className="text-[#E76F51] hover:text-[#1B4332] transition">✏️ Editar</button>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b flex justify-between items-center"><h2 className="text-xl font-bold text-[#1B4332]">Agregar stock</h2><button onClick={() => setShowAddModal(false)} className="text-2xl">&times;</button></div>
            <div className="p-5 space-y-4">
              <select value={newStock.product_id} onChange={(e) => setNewStock({ ...newStock, product_id: parseInt(e.target.value) })} className="w-full p-2 border rounded-xl"><option value={0}>Seleccionar producto</option>{products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>
              <select value={newStock.branch_id} onChange={(e) => setNewStock({ ...newStock, branch_id: parseInt(e.target.value) })} className="w-full p-2 border rounded-xl"><option value={0}>Seleccionar sucursal</option>{branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}</select>
              <input type="number" placeholder="Cantidad" value={newStock.quantity} onChange={(e) => setNewStock({ ...newStock, quantity: parseInt(e.target.value) })} className="w-full p-2 border rounded-xl" />
              <input type="text" placeholder="Ubicación (opcional)" value={newStock.location_code} onChange={(e) => setNewStock({ ...newStock, location_code: e.target.value })} className="w-full p-2 border rounded-xl" />
              <div className="flex justify-end gap-3"><button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl">Cancelar</button><button onClick={addStock} className="px-4 py-2 bg-[#1B4332] text-white rounded-xl">Agregar</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
