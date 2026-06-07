'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BodegaPage() {
  const [loading, setLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (profile) setEmployeeName(profile.full_name || 'Bodeguero')
      setLoading(false)
    }
    fetchUser()
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/inventario" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <h2 className="font-semibold text-lg">📦 Inventario</h2>
            <p className="text-gray-500 text-sm">Control de stock de productos</p>
          </Link>
          <Link href="/bodega/compras" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <h2 className="font-semibold text-lg">📥 Compras</h2>
            <p className="text-gray-500 text-sm">Registrar entrada de productos</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
