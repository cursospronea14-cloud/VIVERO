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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

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

  if (loading) {
    return <div className="text-center py-12">Cargando productos...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gris-texto">Productos</h1>
        <button
          onClick={() => openModal()}
          className="bg-agave text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
        >
          + Nuevo producto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Imagen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Costo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Margen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gris-suave uppercase">Acciones</th>
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
                        <Image src={product.image_url} alt={product.name} width={40} height={40} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">🌵</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gris-suave">{product.sku || '-'}</td>
                    <td className="px-6 py-4 text-agave font-medium">Q{product.base_price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">Q{product.cost_price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${Number(margin) >= 50 ? 'bg-exito/20 text-exito' : 'bg-peligro/20 text-peligro'}`}>
                        {margin}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${product.is_active ? 'bg-exito/20 text-exito' : 'bg-gray-200 text-gray-600'}`}>
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openModal(product)} className="text-flor hover:text-flor/80">✏️</button>
                        <button onClick={() => handleDelete(product.id)} className="text-peligro hover:text-peligro/80">🗑️</button>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
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
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Precio base (GTQ)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Costo (GTQ)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SKU (código)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_plant}
                      onChange={(e) => setFormData({ ...formData, is_plant: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Es planta viva</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Activo (visible en tienda)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded-lg"
                />
                {editingProduct?.image_url && !imageFile && (
                  <p className="text-xs text-gris-suave mt-1">Imagen actual: {editingProduct.image_url.split('/').pop()}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-agave text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                >
                  {uploading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
