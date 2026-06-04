'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('1. Intentando login con:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('2. Error de autenticación:', error)
        toast.error('Correo o contraseña incorrectos')
        setLoading(false)
        return
      }

      console.log('3. Usuario autenticado:', data.user?.id)

      if (data?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('4. Error obteniendo perfil:', profileError)
          toast.error('Error al obtener el perfil del usuario')
          setLoading(false)
          return
        }

        console.log('5. Perfil encontrado:', profile)
        console.log('6. Rol del usuario:', profile?.role)

        toast.success(`Bienvenido ${profile?.full_name || 'Usuario'}`)

        // Redirigir según el rol
        if (profile?.role === 'admin' || profile?.role === 'gerente') {
          console.log('7. Redirigiendo a /admin')
          router.push('/admin')
        } else {
          console.log('7. Redirigiendo a /pos')
          router.push('/pos')
        }
      }
    } catch (err) {
      console.error('Error inesperado:', err)
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B4332]/10 to-[#E9D8A6]/20">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#1B4332] rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B4332]">FLORECE</h1>
          <p className="text-gray-500 text-sm">Cactus & Suculentas</p>
          <p className="text-xs italic text-gray-400 mt-2">"Dios hace florecer el desierto"</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              placeholder="admin@florece.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1B4332] text-white py-2 rounded-lg font-semibold hover:bg-[#2D6A4F] transition disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Sistema de gestión de vivero</p>
          <p className="mt-1">© 2026 Florece</p>
        </div>
      </div>
    </div>
  )
}
