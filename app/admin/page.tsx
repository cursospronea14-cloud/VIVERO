'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      setUser(session.user)
      setLoading(false)
    }
    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332]"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B4332]">Dashboard Administrador</h1>
      <p className="text-gray-500 mt-2">Bienvenido, {user?.email}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-lg">📦 Productos</h3>
          <p className="text-gray-500 text-sm">Gestiona el catálogo</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-lg">💰 Pedidos</h3>
          <p className="text-gray-500 text-sm">Revisa ventas</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-lg">👥 Empleados</h3>
          <p className="text-gray-500 text-sm">Administra personal</p>
        </div>
      </div>
    </div>
  )
}
