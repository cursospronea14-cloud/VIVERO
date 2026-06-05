'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function FumigacionPage() {
  const [loading, setLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const [pendingTreatments, setPendingTreatments] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    product_id: '',
    treatment_type: 'fumigacion',
    product_used: '',
    notes: '',
  })
  const router = useRouter()

  useEffect(() => {
    fetchUser()
    fetchPendingTreatments()
  }, [])

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    if (profile) setEmployeeName(profile.full_name || 'Fumigador')
    setLoading(false)
  }

  async function fetchPendingTreatments() {
    const { data } = await supabase
      .from('plant_maintenance')
      .select('*')
      .gte('next_application_date', new Date().toISOString().split('T')[0])
      .limit(5)
    if (data) setPendingTreatments(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('plant_maintenance')
      .insert({
        product_id: parseInt(formData.product_id),
        treatment_type: formData.treatment_type,
        product_used: formData.product_used,
        applied_by: user?.id,
        applied_at: new Date().toISOString().split('T')[0],
        notes: formData.notes,
      })
    
    if (error) {
      toast.error('Error al registrar tratamiento')
    } else {
      toast.success('Tratamiento registrado')
      setShowModal(false)
      setFormData({ product_id: '', treatment_type: 'fumigacion', product_used: '', notes: '' })
    }
  }

  async function handleLogout() {
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
      <header className="bg-[#1B4332] text-white shadow-lg">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Panel de Fumigación</h1>
            <p className="text-sm text-white/70">Bienvenido, {employeeName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próximos tratamientos */}
          <div className="bg-white rounded-xl shadow-md">
            <div className="p-5 border-b">
              <h2 className="font-semibold text-lg text-[#1B4332]">📋 Próximos tratamientos</h2>
            </div>
            <div className="divide-y">
              {pendingTreatments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No hay tratamientos pendientes</div>
              ) : (
                pendingTreatments.map((treatment) => (
                  <div key={treatment.id} className="p-4">
                    <p className="font-medium">Tratamiento #{treatment.id}</p>
                    <p className="text-sm text-gray-500">Próxima aplicación: {treatment.next_application_date}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-semibold text-lg text-[#1B4332] mb-4">🌿 Acciones rápidas</h2>
            <div className="space-y-3">
              <button onClick={() => setShowModal(true)} className="w-full bg-[#1B4332] text-white py-3 rounded-lg hover:bg-[#2D6A4F] transition">
                + Registrar nuevo tratamiento
              </button>
              <Link href="/admin/insumos" className="block w-full bg-[#E76F51] text-white py-3 rounded-lg text-center hover:bg-opacity-90 transition">
                📦 Solicitar insumos
              </Link>
              <Link href="/admin/reportes" className="block w-full bg-gray-200 text-[#1B4332] py-3 rounded-lg text-center hover:bg-gray-300 transition">
                📊 Ver historial
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para registrar tratamiento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1B4332]">Registrar tratamiento</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de tratamiento</label>
                <select
                  value={formData.treatment_type}
                  onChange={(e) => setFormData({ ...formData, treatment_type: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value="fumigacion">Fumigación</option>
                  <option value="fertilizacion">Fertilización</option>
                  <option value="poda">Poda</option>
                  <option value="transplante">Transplante</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Producto utilizado</label>
                <input
                  type="text"
                  value={formData.product_used}
                  onChange={(e) => setFormData({ ...formData, product_used: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                  placeholder="Ej: Insecticida X, Abono Y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                  rows={3}
                  placeholder="Observaciones del tratamiento..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#1B4332] text-white rounded-xl">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
