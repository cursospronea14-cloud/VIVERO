'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [tip, setTip] = useState('')
  const router = useRouter()

  const tips = [
    { text: '🌵 Los cactus almacenan agua en sus tejidos, permitiéndoles sobrevivir largas temporadas de sequía.', icon: '💧' },
    { text: '🌿 Las suculentas necesitan riego profundo pero espaciado. Mejor que le falte agua a que le sobre.', icon: '💚' },
    { text: '☀️ La mayoría de cactus y suculentas necesitan al menos 4-6 horas de luz solar directa al día.', icon: '☀️' },
    { text: '🪴 Usa macetas con drenaje y tierra especial para cactus para evitar encharcamientos.', icon: '🌱' },
    { text: '🌸 Muchas suculentas florecen en primavera. Sus flores pueden durar semanas.', icon: '🌸' },
    { text: '📦 Ofrecemos precios especiales por mayoreo. Consulta nuestras promociones.', icon: '📦' },
    { text: '🚚 Realizamos envíos a domicilio en toda Guatemala.', icon: '🚚' },
    { text: '🌎 Aceptamos pagos en Quetzales (GTQ) y Dólares (USD).', icon: '💵' },
  ]

  useEffect(() => {
    // Cambiar tip cada 8 segundos
    const interval = setInterval(() => {
      const randomTip = tips[Math.floor(Math.random() * tips.length)]
      setTip(randomTip.text)
    }, 8000)
    
    // Mostrar primer tip
    setTip(tips[0].text)
    
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

    toast.success('Bienvenido')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-verde-oscuro/5 to-arena/20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-4">
        
        {/* Panel izquierdo - Información de plantas */}
        <div className="bg-gris-info rounded-2xl shadow-xl p-8 hidden lg:block">
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 bg-verde-oscuro rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🌵</span>
              </div>
              <h2 className="text-2xl font-bold text-verde-oscuro mb-2">Florece</h2>
              <p className="text-piedra mb-6">Cactus y Suculentas</p>
              
              <div className="border-l-4 border-verde-oscuro pl-4 mb-8">
                <p className="text-gris-texto italic">"Dios hace florecer el desierto. Isaías 35:1"</p>
              </div>

              <div className="info-panel">
                <p className="text-sm text-piedra leading-relaxed">
                  <span className="text-2xl block mb-2">🌿</span>
                  {tip}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-arena">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>🚚</span>
                  <span className="text-piedra">Envíos a domicilio</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💳</span>
                  <span className="text-piedra">Pagos en GTQ/USD</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span className="text-piedra">Precios por mayoreo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🌱</span>
                  <span className="text-piedra">Guía de cuidado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho - Formulario de login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-verde-oscuro rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌵</span>
            </div>
            <h1 className="text-2xl font-bold text-verde-oscuro">Acceso al Sistema</h1>
            <p className="text-gris-suave text-sm mt-1">Ingresa tus credenciales</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gris-texto mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-oscuro focus:border-transparent"
                placeholder="admin@florece.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gris-texto mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-oscuro focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-verde-oscuro text-white py-2.5 rounded-lg font-semibold hover:bg-agave transition disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-arena text-center">
            <p className="text-xs text-gris-suave">
              ¿Problemas para acceder? Contacta al administrador
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
