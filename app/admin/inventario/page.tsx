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
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingStock, setEditingStock] = useState<{ productId: number; branchId: number; quantity: number } | null>(null)

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    if (branches.length > 0) {
      fetchStock()
    }
  }, [selectedBranch, branches])

  async function fetchBranches() {
    const { data } = await supabase
      .from('branches')
      .select('id, name')
      .order('name')
    if (data) setBranches(data)
  }

  async function fetchStock() {
    setLoading(true)
    
    let query = supabase
      .from('branch_stock')
      .select(`
        quantity,
        location_code,
        branch_id,
        product_id,
        products (name)
      `)
    
    if (selectedBranch) {
      query = query.eq('branch_id', selectedBranch)
    }
    
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
    const { error } = await supabase
      .from('branch_stock')
      .update({ quantity: newQuantity })
      .eq('product_id', productId)
      .eq('branch_id', branchId)
    
    if (error) {
      toast.error('Error al actualizar stock')
    } else {
      toast.success('Stock actualizado')
      fetchStock()
      setEditingStock(null)
    }
  }

  async function addStock() {
    // Redirigir a productos para crear nuevo producto con stock
    window.location.href = '/admin/productos'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gris-texto">Inventario</h1>
        <div className="flex gap-3">
          <select
            value={selectedBranch || ''}
            onChange={(e) => setSelectedBranch(e.target.value ? parseInt(e.target.value) : null)}
            className="p-2 border rounded-lg"
          >
            <option value="">Todas las sucursales</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <button
            onClick={addStock}
            className="bg-agave text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
          >
            + Agregar producto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Sucursal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stock.map((item) => (
                <tr key={`${item.product_id}-${item.branch_id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{item.product_name}</td>
                  <td className="px-6 py-4 text-sm">{item.branch_name}</td>
                  <td className="px-6 py-4 text-sm text-gris-suave">{item.location_code || '-'}</td>
                  <td className="px-6 py-4">
                    {editingStock?.productId === item.product_id && editingStock?.branchId === item.branch_id ? (
                      <input
                        type="number"
                        value={editingStock.quantity}
                        onChange={(e) => setEditingStock({ ...editingStock, quantity: parseInt(e.target.value) })}
                        className="w-24 p-1 border rounded"
                        autoFocus
                      />
                    ) : (
                      <span className={`font-medium ${item.quantity <= 5 ? 'text-peligro' : 'text-agave'}`}>
                        {item.quantity} unidades
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {item.quantity <= 0 ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-peligro/20 text-peligro">Agotado</span>
                    ) : item.quantity <= 5 ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Stock bajo</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-exito/20 text-exito">Normal</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingStock?.productId === item.product_id && editingStock?.branchId === item.branch_id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStock(item.product_id, item.branch_id, editingStock.quantity)}
                          className="text-exito"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingStock(null)}
                          className="text-peligro"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingStock({
                          productId: item.product_id,
                          branchId: item.branch_id,
                          quantity: item.quantity,
                        })}
                        className="text-flor hover:text-flor/80"
                      >
                        ✏️ Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
