'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface Category {
  id: number
  name: string
  slug: string
  is_insumo: boolean
  display_order: number
}

export default function AdminCategorias() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    is_insumo: false,
    display_order: 0,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('display_order')
    if (data) setCategories(data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const slug = formData.slug || formData.name.toLowerCase().replace(/ /g, '-')
    
    if (editingCat) {
      const { error } = await supabase
        .from('categories')
        .update({ ...formData, slug })
        .eq('id', editingCat.id)
      
      if (error) {
        toast.error('Error al actualizar categoría')
      } else {
        toast.success('Categoría actualizada')
        fetchCategories()
        setShowModal(false)
      }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([{ ...formData, slug }])
      
      if (error) {
        toast.error('Error al crear categoría')
      } else {
        toast.success('Categoría creada')
        fetchCategories()
        setShowModal(false)
      }
    }
  }

  async function handleDelete(id: number) {
    if (confirm('¿Eliminar esta categoría? Los productos quedarán sin categoría.')) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      
      if (error) {
        toast.error('Error al eliminar categoría')
      } else {
        toast.success('Categoría eliminada')
        fetchCategories()
      }
    }
  }

  function openModal(cat?: Category) {
    if (cat) {
      setEditingCat(cat)
      setFormData({
        name: cat.name,
        slug: cat.slug,
        is_insumo: cat.is_insumo,
        display_order: cat.display_order,
      })
    } else {
      setEditingCat(null)
      setFormData({
        name: '',
        slug: '',
        is_insumo: false,
        display_order: categories.length,
      })
    }
    setShowModal(true)
  }

  if (loading) return <div className="text-center py-12">Cargando...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gris-texto">Categorías</h1>
        <button
          onClick={() => openModal()}
          className="bg-agave text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
        >
          + Nueva categoría
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {categories.map((cat) => (
            <div key={cat.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                  <p className="text-sm text-gris-suave">Slug: {cat.slug}</p>
                  <p className="text-xs mt-1">
                    {cat.is_insumo ? '📦 Insumo' : '🌱 Planta'}
                  </p>
                  <p className="text-xs">Orden: {cat.display_order}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(cat)} className="text-flor">✏️</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-peligro">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingCat ? 'Editar categoría' : 'Nueva categoría'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="ejemplo-categoria"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_insumo}
                    onChange={(e) => setFormData({ ...formData, is_insumo: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Es categoría de insumos (tierra, macetas, etc.)</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Orden de visualización</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-agave text-white rounded-lg">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
