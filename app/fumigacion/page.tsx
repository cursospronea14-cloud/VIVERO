'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function FumigacionPage() {
  const [loading, setLoading] = useState(true)
  const [employeeName, setEmployeeName] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    product_name: '',
    treatment_type: 'fumigacion',
    product_used: '',
    notes: '',
  })
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (profile) setEmployeeName(profile.full_name || 'Fumigador')
      setLoading(false)
    }
    fetchData()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('plant_maintenance').insert({
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
      setFormData({ product_name: '', treatment_type: 'fumigacion', product_used: '', notes: '' })
    }
  }

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
          <h1 className="text-xl font-bold">Panel de Fumigación</h1>
          <p className="text-sm">Bienvenido, {employeeName}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded-lg">Cerrar sesión</button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-semibold mb-4">🌿 Historial de tratamientos</h2>
            <p className="text-gray-500 text-center py-8">No hay tratamientos registrados</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-semibold mb-4">📋 Acciones rápidas</h2>
            <div className="space-y-3">
              <button onClick={() => setShowModal(true)} className="block w-full bg-[#1B4332] text-white py-2 rounded-lg text-center">➕ Registrar tratamiento</button>
              <Link href="/admin/insumos" className="block w-full bg-gray-200 text-[#1B4332] py-2 rounded-lg text-center">📦 Solicitar insumos</Link>
            </div>
          </div>
        </div>
      </div>

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
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Producto utilizado</label>
                <input
                  type="text"
                  value={formData.product_used}
                  onChange={(e) => setFormData({ ...formData, product_used: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                  placeholder="Ej: Insecticida X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                  rows={3}
                  placeholder="Observaciones..."
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
