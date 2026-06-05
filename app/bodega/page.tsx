'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface StockItem {
  product_id: number
  product_name: string
  branch_id: number
  branch_name: string
  quantity: number
  location_code: string
}

export default function BodegaPage() {
  const [loading, setLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const [stock, setStock] = useState<StockItem[]>([])
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([])
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchUser()
    fetchBranches()
    fetchStock()
  }, [])

  useEffect(() => {
    fetchStock()
  }, [selectedBranch])

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    if (profile) setEmployeeName(profile.full_name || 'Bodeguero')
  }

  async function fetchBranches() {
    const { data } = await supabase.from('branches').select('id, name').order('name')
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
      const formattedStock: StockItem[] = data.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.products?.name || '',
        branch_id: item.branch_id,
        branch_name: branches.find(b => b.id === item.branch_id)?.name || '',
        quantity: item.quantity,
        location_code: item.location_code || '',
      }))

      setStock(formattedStock)
      setLowStockItems(formattedStock.filter(item => item.quantity <= 10))
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const totalStock = stock.reduce((sum, item) => sum + item.quantity, 0)

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
        <div className="px-6 py-4 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold">Panel de Bodega</h1>
            <p className="text-sm text-white/70">Bienvenido, {employeeName}</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedBranch || ''}
              onChange={(e) => setSelectedBranch(e.target.value ? parseInt(e.target.value) : null)}
              className="bg-white/20 text-white p-2 rounded-lg text-sm"
            >
              <option value="">Todas las sucursales</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-gray-500 text-sm">Total productos</p>
            <p className="text-2xl font-bold text-[#1B4332]">{stock.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-gray-500 text-sm">Unidades en stock</p>
            <p className="text-2xl font-bold text-[#1B4332]">{totalStock}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-gray-500 text-sm">Sucursales</p>
            <p className="text-2xl font-bold text-[#1B4332]">{branches.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-gray-500 text-sm">Stock bajo</p>
            <p className="text-2xl font-bold text-[#E76F51]">{lowStockItems.length}</p>
          </div>
        </div>

        {/* Alerta de stock bajo */}
        {lowStockItems.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-yellow-700">¡Alerta de stock bajo!</p>
                <p className="text-sm text-yellow-600">Hay {lowStockItems.length} productos con menos de 10 unidades. Revisa la lista para reabastecer.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de inventario */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-[#1B4332]">📦 Inventario actual</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stock.map((item) => (
                  <tr key={`${item.product_id}-${item.branch_id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-sm">{item.product_name}</td>
                    <td className="px-4 py-3 text-sm">{item.branch_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.location_code || 'No asignada'}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${item.quantity <= 5 ? 'text-red-600' : item.quantity <= 10 ? 'text-yellow-600' : 'text-[#1B4332]'}`}>
                        {item.quantity} unidades
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.quantity <= 0 ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Agotado</span>
                      ) : item.quantity <= 5 ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Stock crítico</span>
                      ) : item.quantity <= 10 ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Stock bajo</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Normal</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href="/bodega/compras" className="text-[#1B4332] text-sm hover:underline">
                        Reabastecer →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h2 className="font-semibold text-[#1B4332] mb-4">📋 Acciones rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/bodega/compras" className="bg-[#1B4332]/10 p-4 rounded-xl text-center hover:bg-[#1B4332]/20 transition">
              <span className="text-2xl block">📥</span>
              <span className="text-sm font-medium">Registrar compra</span>
            </Link>
            <Link href="/admin/inventario" className="bg-[#1B4332]/10 p-4 rounded-xl text-center hover:bg-[#1B4332]/20 transition">
              <span className="text-2xl block">📦</span>
              <span className="text-sm font-medium">Ajustar stock</span>
            </Link>
            <Link href="/admin/reportes" className="bg-[#1B4332]/10 p-4 rounded-xl text-center hover:bg-[#1B4332]/20 transition">
              <span className="text-2xl block">📊</span>
              <span className="text-sm font-medium">Reportes</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
