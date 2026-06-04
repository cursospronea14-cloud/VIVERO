'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const router = useRouter()

  const infoCards = [
    { title: '🌵 Consejo de Cuidado', text: 'Riega tus cactus solo cuando la tierra esté completamente seca.', icon: '💧', color: '#2D6A4F' },
    { title: '🎁 Promoción Especial', text: 'Lleva 3 macetas y paga 2. Válido hasta fin de mes.', icon: '🎁', color: '#E76F51' },
    { title: '⭐ Producto Destacado', text: 'Suculenta Echeveria - Ideal para principiantes.', icon: '⭐', color: '#1B4332' },
    { title: '📢 Novedad', text: 'Nueva colección de cactus raros. ¡Mira el catálogo!', icon: '📢', color: '#E9D8A6' },
    { title: '🌿 Cuidado de Suculentas', text: 'Necesitan al menos 4-6 horas de luz solar indirecta al día.', icon: '☀️', color: '#2D6A4F' },
    { title: '📦 Envíos', text: 'Realizamos envíos a toda Guatemala.', icon: '🚚', color: '#E76F51' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % infoCards.length)
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

  const currentCardData = infoCards[currentCard]

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div 
        className="w-1/2 flex flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='43' y='25' width='14' height='40' rx='7' fill='white'/%3E%3Crect x='30' y='35' width='12' height='25' rx='6' fill='white'/%3E%3Crect x='58' y='38' width='12' height='22' rx='6' fill='white'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '60px',
          }}
        />
        
        <div className="text-center max-w-md relative z-10">
          {/* Logo con logo.jpg */}
          <div className="w-28 h-28 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
            <img 
              src="/logo.jpg" 
              alt="Florece Logo"
              className="object-cover w-full h-full"
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.style.backgroundColor = '#1B4332'
                  parent.innerHTML = '<span class="text-3xl">🌵</span>'
                }
              }}
            />
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">FLORECE</h1>
          <p className="text-[#E9D8A6] text-xl mb-4 tracking-wide">Cactus & Suculentas</p>
          
          <div className="border-l-4 border-[#E9D8A6] pl-4 mb-8">
            <p className="text-white/90 text-lg italic">"Dios hace florecer el desierto"</p>
            <p className="text-white/60 text-sm mt-1">Isaías 35:1</p>
          </div>

          <div className="mt-8 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-white/70 text-xs uppercase tracking-wider mb-2">Vista previa del sistema</p>
            <div className="flex justify-center gap-4 text-white/50 text-sm">
              <span>📦 Inventario</span>
              <span>📋 Pedidos</span>
              <span>👥 Clientes</span>
              <span>💰 Ventas</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-white/70 text-xs mt-8">
            <div className="flex items-center gap-1 justify-center"><span>🚚</span><span>Envíos a domicilio</span></div>
            <div className="flex items-center gap-1 justify-center"><span>💳</span><span>Pagos GTQ/USD</span></div>
            <div className="flex items-center gap-1 justify-center"><span>📦</span><span>Precios por mayoreo</span></div>
            <div className="flex items-center gap-1 justify-center"><span>🌱</span><span>Guía de cuidado</span></div>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="w-1/2 bg-[#FDFBF7] flex flex-col justify-center p-12 overflow-y-auto">
        <div className="max-w-md mx-auto w-full">
          {/* Tarjeta rotativa */}
          <div 
            className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-l-8 transition-all duration-500 hover:shadow-2xl"
            style={{ borderLeftColor: currentCardData.color }}
          >
            <div className="flex items-start gap-4">
              <div className="text-5xl">{currentCardData.icon}</div>
              <div className="flex-1">
                <h3 className="font-bold text-[#1B4332] text-lg mb-2">{currentCardData.title}</h3>
                <p className="text-[#4A4A4A] text-sm leading-relaxed">{currentCardData.text}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {infoCards.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentCard ? 'bg-[#1B4332] w-6' : 'bg-[#E9D8A6] w-1.5'}`} 
                />
              ))}
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-[#1B4332] mb-2">Acceso al Sistema</h2>
            <p className="text-[#6B6B6B] text-sm mb-6">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Correo electrónico</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]">📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                    placeholder="admin@florece.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Contraseña</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1B4332] transition"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-semibold hover:bg-[#2D6A4F] transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-[#6B6B6B] mt-4">
                <span>🔒</span>
                <span>Conexión segura SSL</span>
                <span>•</span>
                <span>Datos cifrados</span>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-[#E9D8A6] text-center space-y-2">
              <div className="flex justify-center gap-4 text-xs text-[#6B6B6B]">
                <a href="#" className="hover:text-[#1B4332] transition">Soporte técnico</a>
                <span>•</span>
                <a href="#" className="hover:text-[#1B4332] transition">Política de privacidad</a>
                <span>•</span>
                <a href="#" className="hover:text-[#1B4332] transition">Términos</a>
              </div>
              <p className="text-xs text-[#6B6B6B]">© 2026 Florece • Versión 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
