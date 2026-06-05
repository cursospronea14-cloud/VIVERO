'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: {
    id: number
    name: string
    description: string
    base_price: number
    image_url: string
    stock: number
    branch_name: string
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = () => {
    if (quantity <= 0) {
      toast.error('Selecciona una cantidad válida')
      return
    }

    if (product.stock < quantity) {
      toast.error(`Solo tenemos ${product.stock} unidades disponibles`)
      return
    }

    setIsAdding(true)
    addItem({
      id: product.id,
      name: product.name,
      price: product.base_price,
      quantity: quantity,
    })
    toast.success(`Agregado: ${quantity}x ${product.name}`)
    setTimeout(() => setIsAdding(false), 500)
  }

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(prev => prev + 1)
    } else {
      toast.error(`Máximo disponible: ${product.stock} unidades`)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  return (
    <div className="card group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Imagen */}
      <Link href={`/product/${product.id}`}>
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-arena">
              <span className="text-agave text-6xl">🌵</span>
            </div>
          )}
        </div>
      </Link>

      {/* Información */}
      <div className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-bold text-lg text-gris-texto hover:text-agave transition line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-gris-suave text-sm mt-1 line-clamp-2">
          {product.description || 'Planta de fácil cuidado'}
        </p>

        {/* Stock y ubicación */}
        <div className="mt-2 flex flex-col gap-1">
          {product.stock > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-exito bg-exito/10 px-2 py-0.5 rounded-full">
                ✅ Disponible
              </span>
              <span className="text-xs text-gris-suave">
                {product.stock} unidades
              </span>
            </div>
          ) : (
            <span className="text-xs text-peligro bg-peligro/10 px-2 py-0.5 rounded-full inline-block">
              ❌ Agotado
            </span>
          )}
          {product.branch_name && (
            <span className="text-xs text-gris-suave flex items-center gap-1">
              📍 {product.branch_name}
            </span>
          )}
        </div>

        {/* Precio y selector de cantidad */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xl font-bold text-agave">
              Q{product.base_price.toFixed(2)}
            </span>
            {product.stock > 0 && (
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg">
                <button
                  onClick={decreaseQuantity}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="w-8 text-center text-sm">{quantity}</span>
                <button
                  onClick={increaseQuantity}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAdding}
            className={`w-full py-2 rounded-lg font-semibold transition-all duration-300 ${
              product.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-flor hover:bg-flor/85 text-white hover:shadow-md'
            }`}
          >
            {isAdding ? '✓ Agregado' : product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  )
}
