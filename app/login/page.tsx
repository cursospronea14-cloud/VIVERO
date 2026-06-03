'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentTip, setCurrentTip] = useState(0)
  const router = useRouter()

  const tips = [
    { text: 'Los cactus almacenan agua en sus tejidos, permitiéndoles sobrevivir largas temporadas de sequía.', icon: '💧', image: '🌵' },
    { text: 'Las suculentas necesitan riego profundo pero espaciado. Mejor que le falte agua a que le sobre.', icon: '💚', image: '🌿' },
    { text: 'La mayoría de cactus y suculentas necesitan al menos 4-6 horas de luz solar directa al día.', icon: '☀️', image: '☀️' },
    { text: 'Usa macetas con drenaje y tierra especial para cactus para evitar encharcamientos.', icon: '🪴', image: '🌱' },
    { text: 'Muchas suculentas florecen en primavera. Sus flores pueden durar semanas.', icon: '🌸', image: '🌸' },
    { text: 'Ofrecemos precios especiales por mayoreo. Consulta nuestras promociones.', icon: '📦', image: '📦' },
    { text: 'Realizamos envíos a domicilio en toda Guatemala.', icon: '🚚', image: '🚚' },
    { text: 'Aceptamos pagos en Quetzales (GTQ) y Dólares (USD).', icon: '💵', image: '💵' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user?.id)
      .single()

    if (profile?.role === 'admin' || profile?.role === 'gerente') {
      router.push('/admin')
    } else {
      router.push('/pos')
    }

    toast.success('Bienvenido al sistema')
    setLoading(false)
  }

  const tip = tips[currentTip]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B4332]/5 to-[#E9D8A6]/20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-4">
        
        {/* Panel izquierdo - Información y marca */}
        <div className="bg-[#F5F5F0] rounded-2xl shadow-xl p-8 hidden lg:block">
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 bg-[#1B4332] rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Florece Logo"
                  width={120}
                  height={120}
                  className="object-cover"
                />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1B4332]">Florece</h2>
              <p className="text-[#4A4A4A]">Cactus y Suculentas</p>
              <div className="border-l-4 border-[#1B4332] pl-4 mt-4 mx-auto max-w-xs">
                <p className="text-[#2D2D2D] italic text-sm">"Dios hace florecer el desierto. Isaías 35:1"</p>
              </div>
            </div>

            {/* Tip rotativo */}
            <div className="bg-white rounded-xl p-5 shadow-md mt-4 border border-[#E9D8A6]">
              <div className="text-center">
                <span className="text-5xl block mb-3">{tip.image}</span>
                <p className="text-[#4A4A4A] text-sm leading-relaxed">{tip.text}</p>
              </div>
            </div>

            {/* Características */}
            <div className="mt-6 pt-6 border-t border-[#E9D8A6]">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-[#4A4A4A]"><span>🚚</span><span>Envíos a domicilio</span></div>
                <div className="flex items-center gap-2 text-[#4A4A4A]"><span>💳</span><span>Pagos en GTQ/USD</span></div>
                <div className="flex items-center gap-2 text-[#4A4A4A]"><span>📦</span><span>Precios por mayoreo</span></div>
                <div className="flex items-center gap-2 text-[#4A4A4A]"><span>🌱</span><span>Guía de cuidado</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-[#1B4332] rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <Image src="/logo.png" alt="Logo" width={80} height={80} className="object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-[#1B4332]">Acceso al Sistema</h1>
            <p className="text-[#6B6B6B] text-sm mt-1">Ingresa tus credenciales</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                placeholder="admin@florece.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B4332] text-white py-2.5 rounded-lg font-semibold hover:bg-[#2D6A4F] transition disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E9D8A6] text-center">
            <p className="text-xs text-[#6B6B6B]">Sistema de gestión de vivero</p>
          </div>
        </div>
      </div>
    </div>
  )
}
