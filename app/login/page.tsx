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
    { title: '🌵 Cuidado de Cactus', text: 'Los cactus almacenan agua en sus tejidos. Riega solo cuando la tierra esté completamente seca.', icon: '💧' },
    { title: '🌿 Suculentas Saludables', text: 'Las suculentas necesitan riego profundo pero espaciado. Mejor que le falte agua a que le sobre.', icon: '💚' },
    { title: '☀️ Luz Solar', text: 'Necesitan al menos 4-6 horas de luz solar directa al día para un crecimiento óptimo.', icon: '☀️' },
    { title: '🪴 Macetas y Drenaje', text: 'Usa macetas con agujeros y tierra especial para cactus para evitar encharcamientos.', icon: '🌱' },
    { title: '🌸 Floración', text: 'Muchas suculentas florecen en primavera. Sus flores pueden durar semanas.', icon: '🌸' },
    { title: '📦 Precios por Mayoreo', text: 'Ofrecemos precios especiales por volumen. Consulta nuestras promociones.', icon: '📦' },
    { title: '🚚 Envíos a Domicilio', text: 'Realizamos envíos a toda Guatemala. Pregunta por tu zona.', icon: '🚚' },
    { title: '💵 Métodos de Pago', text: 'Aceptamos pagos en Quetzales (GTQ) y Dólares (USD).', icon: '💵' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length)
    }, 7000)
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

  const current = tips[currentTip]

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - ESTÁTICO (no se mueve) */}
      <div className="w-1/2 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] flex flex-col items-center justify-center p-12">
        <div className="text-center max-w-md">
          {/* Logo circular */}
          <div className="w-32 h-32 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
            <Image
              src="/logo.png"
              alt="Florece Logo"
              width={120}
              height={120}
              className="object-cover"
              priority
              onError={(e) => {
                console.error('Error loading logo')
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">Florece</h1>
          <p className="text-[#E9D8A6] text-lg mb-6">Cactus y Suculentas</p>
          
          <div className="border-l-4 border-[#E9D8A6] pl-4 mb-8">
            <p className="text-white/90 italic text-lg">"Dios hace florecer el desierto"</p>
            <p className="text-white/70 text-sm mt-1">Isaías 35:1</p>
          </div>

          {/* Características estáticas */}
          <div className="grid grid-cols-2 gap-4 text-white/80 text-sm mt-8">
            <div className="flex items-center gap-2"><span>🚚</span><span>Envíos a domicilio</span></div>
            <div className="flex items-center gap-2"><span>💳</span><span>Pagos GTQ/USD</span></div>
            <div className="flex items-center gap-2"><span>📦</span><span>Precios por mayoreo</span></div>
            <div className="flex items-center gap-2"><span>🌱</span><span>Guía de cuidado</span></div>
          </div>
        </div>
      </div>

      {/* Panel derecho - MÓVIL (información animada + formulario) */}
      <div className="w-1/2 bg-[#FDFBF7] flex flex-col justify-center p-12 overflow-y-auto">
        <div className="max-w-md mx-auto w-full">
          {/* Tarjeta de tip animada */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-[#E9D8A6] animate-pulse-slow">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{current.icon}</div>
              <div>
                <h3 className="font-bold text-[#1B4332] text-lg mb-2">{current.title}</h3>
                <p className="text-[#4A4A4A] text-sm leading-relaxed">{current.text}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {tips.map((_, idx) => (
                <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentTip ? 'bg-[#1B4332] w-4' : 'bg-[#E9D8A6]'}`} />
              ))}
            </div>
          </div>

          {/* Formulario de login */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-[#1B4332] mb-2">Acceso al Sistema</h2>
            <p className="text-[#6B6B6B] text-sm mb-6">Ingresa tus credenciales para continuar</p>

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
              <p className="text-xs text-[#6B6B6B]">¿Problemas para acceder? Contacta al administrador</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
