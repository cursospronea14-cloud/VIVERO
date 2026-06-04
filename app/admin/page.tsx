'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B4332]">Dashboard Administrador</h1>
      <p className="text-gray-500 mt-2">Bienvenido al panel de control</p>
    </div>
  )
}
