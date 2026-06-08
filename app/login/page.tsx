'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        const role = profile?.role || 'vendedor'
        if (role === 'admin') router.replace('/admin')
        else if (role === 'bodeguero') router.replace('/bodega')
        else if (role === 'fumigador') router.replace('/fumigacion')
        else router.replace('/pos')
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }
    if (data?.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      const role = profile?.role || 'vendedor'
      toast.success('Bienvenido')
      if (role === 'admin') router.replace('/admin')
      else if (role === 'bodeguero') router.replace('/bodega')
      else if (role === 'fumigador') router.replace('/fumigacion')
      else router.replace('/pos')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B4332]/10 to-[#E9D8A6]/20">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="Logo" className="w-20 h-20 rounded-full mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1B4332]">DESIERTO QUE FLORECE</h1>
          <p className="text-gray-500">Cactus y Suculentas</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" required />
          <button type="submit" disabled={loading} className="w-full bg-[#1B4332] text-white py-3 rounded-lg font-semibold">{loading ? 'Ingresando...' : 'Ingresar'}</button>
        </form>
      </div>
    </div>
  )
}
