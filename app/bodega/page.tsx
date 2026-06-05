'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BodegaPage() {
  const [loading, setLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const [lowStock, setLowStock] = useState<any[]>([])
  const [recentPurchases, setRecentPurchases] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchUser()
    fetchLowStock()
    fetchRecentPurchases()
  }, [])

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    if (profile) setEmployeeName(profile.full_name || 'Bodeguero')
    setLoading(false)
  }

  async function fetchLowStock() {
    const { data } = await supabase.from('branch_stock').select('product_id, quantity, products(name)').lt('quantity', 10).limit(10)
    if (data) setLowStock(data)
  }

  async function fetchRecentPurchases() {
    const { data } = await supabase.from('purchase_lots').select('id, quantity, products(name), received_at').order('received_at', { ascending: false }).limit(5)
    if (data) setRecentPurchases(data)
  }

  async function handleLogout() { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332]"></div></div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#1B4332] text-white shadow-lg"><div className="px-6 py-4 flex justify-between items-center"><div><h1 className="text-xl font-bold">Panel de Bodega</h1><p className="text-sm text-white/70">Bienvenido, {employeeName}</p></div><button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">Cerrar sesión</button></div></header>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md"><div className="p-5 border-b"><h2 className="font-semibold text-[#1B4332]">⚠️ Stock bajo</h2></div><div className="divide-y">{lowStock.length === 0 ? <div className="p-6 text-center text-gray-500">✓ Stock suficiente</div> : lowStock.map((item, idx) => <div key={idx} className="p-4 flex justify-between"><span>{item.products?.name}</span><span className="text-red-600">{item.quantity} unidades</span></div>)}</div><div className="p-4 border-t"><Link href="/admin/inventario" className="text-[#1B4332] text-sm">Ver inventario →</Link></div></div>
          <div className="bg-white rounded-xl shadow-md"><div className="p-5 border-b"><h2 className="font-semibold text-[#1B4332]">📦 Últimas compras</h2></div><div className="divide-y">{recentPurchases.map((p) => <div key={p.id} className="p-4 flex justify-between"><div><p className="font-medium">{p.products?.name}</p><p className="text-xs text-gray-500">{p.quantity} unidades</p></div><p className="text-sm text-gray-500">{new Date(p.received_at).toLocaleDateString()}</p></div>)}</div><div className="p-4 border-t"><Link href="/bodega/compras" className="text-[#1B4332] text-sm">Registrar compra →</Link></div></div>
        </div>
        <div className="mt-6 bg-white rounded-xl shadow-md p-6"><h2 className="font-semibold text-[#1B4332] mb-4">📋 Acciones rápidas</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><Link href="/bodega/compras" className="bg-[#1B4332]/10 p-4 rounded-xl text-center hover:bg-[#1B4332]/20"><span className="text-2xl block">📥</span><span className="text-sm">Registrar compra</span></Link><Link href="/admin/inventario" className="bg-[#1B4332]/10 p-4 rounded-xl text-center hover:bg-[#1B4332]/20"><span className="text-2xl block">📦</span><span className="text-sm">Actualizar stock</span></Link><Link href="/admin/productos" className="bg-[#1B4332]/10 p-4 rounded-xl text-center hover:bg-[#1B4332]/20"><span className="text-2xl block">🌵</span><span className="text-sm">Ver productos</span></Link><Link href="/admin/reportes" className="bg-[#1B4332]/10 p-4 rounded-xl text-center hover:bg-[#1B4332]/20"><span className="text-2xl block">📊</span><span className="text-sm">Reportes</span></Link></div></div>
      </div>
    </div>
  )
}
