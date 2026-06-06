'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BodegaPage() {
  const [loading, setLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const [lowStock, setLowStock] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (profile) setEmployeeName(profile.full_name || 'Bodeguero')

      const { data: stock } = await supabase
        .from('branch_stock')
        .select('product_id, quantity, products(name)')
        .lt('quantity', 10)
        .limit(10)
      if (stock) setLowStock(stock)
      
      setLoading(false)
    }
    fetchData()
  }, [router])

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
          <h1 className="text-xl font-bold">Panel de Bodega</h1>
          <p className="text-sm">Bienvenido, {employeeName}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded-lg">Cerrar sesión</button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md">
            <div className="p-4 border-b"><h2 className="font-semibold">⚠️ Productos con stock bajo</h2></div>
            <div className="divide-y">
              {lowStock.length === 0 ? (
                <div className="p-6 text-center text-gray-500">✓ Todos los productos tienen stock suficiente</div>
              ) : (
                lowStock.map((item, idx) => (
                  <div key={idx} className="p-4 flex justify-between">
                    <span>{item.products?.name}</span>
                    <span className="text-red-600">{item.quantity} unidades</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-semibold mb-4">📋 Acciones rápidas</h2>
            <div className="space-y-3">
              <Link href="/bodega/compras" className="block w-full bg-[#1B4332] text-white py-2 rounded-lg text-center">📥 Registrar compra</Link>
              <Link href="/admin/inventario" className="block w-full bg-gray-200 text-[#1B4332] py-2 rounded-lg text-center">📦 Ver inventario</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
