'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  description: string
  base_price: number
  cost_price: number
  category_id: number
  is_plant: boolean
  is_active: boolean
  image_url: string
  sku: string
}

interface Category {
  id: number
  name: string
}

export default function AdminProductos() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: 0,
    cost_price: 0,
    category_id: 0,
    is_plant: true,
    is_active: true,
    sku: '',
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('name')
    if (data) setProducts(data)
    setLoading(false)
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .order('display_order')
    if (data) setCategories(data)
  }

  async function uploadImage(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (error) {
      toast.error('Error al subir imagen')
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)

    let imageUrl = editingProduct?.image_url || ''

    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile)
      if (uploadedUrl) imageUrl = uploadedUrl
    }

    const productData = {
      ...formData,
      image_url: imageUrl,
    }

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)

      if (error) {
        toast.error('Error al actualizar producto')
      } else {
        toast.success('Producto actualizado')
        fetchProducts()
        setShowModal(false)
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert([productData])

      if (error) {
        toast.error('Error al crear producto')
      } else {
        toast.success('Producto creado')
        fetchProducts()
        setShowModal(false)
      }
    }
    setUploading(false)
  }

  async function handleDelete(id: number) {
    if (confirm('¿Eliminar este producto?')) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Error al eliminar producto')
      } else {
        toast.success('Producto eliminado')
        fetchProducts()
      }
    }
  }

  async function handleToggleStatus(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)

    if (error) {
      toast.error('Error al cambiar estado')
    } else {
      toast.success(`Producto ${product.is_active ? 'desactivado' : 'activado'}`)
      fetchProducts()
    }
  }

  function openModal(product?: Product) {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || '',
        base_price: product.base_price,
        cost_price: product.cost_price,
        category_id: product.category_id,
        is_plant: product.is_plant,
        is_active: product.is_active,
        sku: product.sku || '',
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        base_price: 0,
        cost_price: 0,
        category_id: categories[0]?.id || 0,
        is_plant: true,
        is_active: true,
        sku: '',
      })
    }
    setImageFile(null)
    setShowModal(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
    }).format(amount)
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
          <h1 className="text-2xl font-bold text-[#1B4332]">Productos</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Gestiona el catálogo de plantas e insumos</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#1B4332] text-white px-4 py-2 rounded-xl hover:bg-[#2D6A4F] transition flex items-center gap-2"
        >
          <span>+</span>
          Nuevo producto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Imagen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Costo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Margen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => {
                const margin = product.cost_price > 0
                  ? ((product.base_price - product.cost_price) / product.base_price * 100).toFixed(1)
                  : 0
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {product.image_url ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-lg">🌵</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#2D2D2D]">{product.name}</p>
                      <p className="text-xs text-[#6B6B6B]">{product.is_plant ? 'Planta' : 'Insumo'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6B6B]">{product.sku || '-'}</td>
                    <td className="px-6 py-4 font-medium text-[#1B4332]">{formatCurrency(product.base_price)}</td>
                    <td className="px-6 py-4 text-sm text-[#6B6B6B]">{formatCurrency(product.cost_price)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${Number(margin) >= 50 ? 'bg-green-100 text-green-700' : Number(margin) >= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {margin}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`px-2 py-1 text-xs rounded-full ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openModal(product)} className="text-[#E76F51] hover:text-[#1B4332] transition" title="Editar">
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 transition" title="Eliminar">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E9D8A6] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1B4332]">{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl text-[#6B6B6B] hover:text-[#1B4332]">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-1">SKU (código)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Precio base (GTQ)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                    className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Costo (GTQ)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                    className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Categoría</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Tipo</label>
                  <select
                    value={formData.is_plant ? 'plant' : 'insumo'}
                    onChange={(e) => setFormData({ ...formData, is_plant: e.target.value === 'plant' })}
                    className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  >
                    <option value="plant">🌵 Planta viva</option>
                    <option value="insumo">📦 Insumo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-gray-200 rounded-xl"
                />
                {editingProduct?.image_url && !imageFile && (
                  <p className="text-xs text-[#6B6B6B] mt-1">Imagen actual cargada</p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Producto activo (visible en tienda)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-[#1B4332] text-white rounded-xl hover:bg-[#2D6A4F] transition disabled:opacity-50"
                >
                  {uploading ? 'Guardando...' : 'Guardar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
