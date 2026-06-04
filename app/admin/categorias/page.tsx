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
  image_url: string | null
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
    image_url: '',
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

    const slug = formData.slug || formData.name.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

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
        image_url: cat.image_url || '',
      })
    } else {
      setEditingCat(null)
      setFormData({
        name: '',
        slug: '',
        is_insumo: false,
        display_order: categories.length,
        image_url: '',
      })
    }
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332]"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Categorías</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Organiza tus productos por categorías</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#1B4332] text-white px-4 py-2 rounded-xl hover:bg-[#2D6A4F] transition flex items-center gap-2"
        >
          <span>+</span>
          Nueva categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-[#1B4332] text-lg">{cat.name}</h3>
                  <p className="text-sm text-[#6B6B6B]">/{cat.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(cat)} className="text-[#E76F51] hover:text-[#1B4332] transition">✏️</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700 transition">🗑️</button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E9D8A6]">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cat.is_insumo ? 'bg-[#E76F51]' : 'bg-[#2D6A4F]'}`}></span>
                  <span className="text-xs text-[#6B6B6B]">{cat.is_insumo ? 'Insumos' : 'Plantas'}</span>
                </div>
                <span className="text-xs text-[#6B6B6B]">Orden: {cat.display_order}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <span className="text-5xl block mb-3">📁</span>
          <p className="text-[#6B6B6B]">No hay categorías creadas</p>
          <button onClick={() => openModal()} className="mt-3 text-[#1B4332] underline">Crear primera categoría</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-[#E9D8A6] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1B4332]">{editingCat ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl text-[#6B6B6B] hover:text-[#1B4332]">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  placeholder="Ej: Cactus, Suculentas, Macetas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Slug (URL)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-xl"
                  placeholder="se genera automático"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Orden de visualización</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-200 rounded-xl"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_insumo}
                  onChange={(e) => setFormData({ ...formData, is_insumo: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Categoría de insumos (tierra, macetas, abonos)</span>
              </label>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#1B4332] text-white rounded-xl hover:bg-[#2D6A4F]">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
