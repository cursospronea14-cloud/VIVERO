export const dynamic = 'force-dynamic'

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import { useCartStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface Product {
  id: number
  name: string
  description: string
  base_price: number
  cost_price: number
  image_url: string
  care_instructions_url: string
  is_plant: boolean
}

export default function ProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    fetchProduct()
  }, [id])

  async function fetchProduct() {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      
      if (data) setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Error al cargar el producto')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      id: product.id,
      name: product.name,
      price: product.base_price,
      quantity: quantity,
    })
    toast.success(`Agregado: ${quantity}x ${product.name}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-agave"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gris-suave">Producto no encontrado</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Imagen */}
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-arena">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-auto object-cover"
            />
          ) : (
            <div className="w-full h-96 flex items-center justify-center bg-arena">
              <span className="text-agave text-6xl">🌵</span>
            </div>
          )}
        </div>

        {/* Información */}
        <div>
          <h1 className="text-3xl font-serif text-agave mb-2">{product.name}</h1>
          <p className="text-gris-suave mb-4">{product.description || 'Planta de fácil cuidado'}</p>
          
          <div className="text-3xl font-bold text-flor mb-4">
            Q{product.base_price.toFixed(2)}
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200"
              >
                -
              </button>
              <span className="px-6 py-2">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-flor hover:bg-opacity-85 text-white py-3 rounded-lg font-semibold transition"
            >
              Agregar al carrito
            </button>
          </div>

          {product.is_plant && product.care_instructions_url && (
            <div className="mt-6 p-4 bg-arena/20 rounded-lg">
              <h3 className="font-semibold text-agave mb-2">📖 Instructivo de cuidado</h3>
              <a
                href={product.care_instructions_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-flor hover:underline"
              >
                Descargar PDF →
              </a>
            </div>
          )}

          <div className="mt-6 text-sm text-gris-suave">
            <p>🌱 Planta resistente a la sequía</p>
            <p>💧 Bajo consumo de agua</p>
            <p>🏡 Ideal para interiores y exteriores</p>
          </div>
        </div>
      </div>
    </div>
  )
}
