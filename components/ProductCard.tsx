'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: {
    id: number
    name: string
    description: string
    base_price: number
    image_url: string
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.base_price,
      quantity: 1,
    })
    toast.success(`Agregado: ${product.name}`)
  }

  return (
    <div className="card group">
      <Link href={`/product/${product.id}`}>
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-arena">
              <span className="text-agave text-4xl">🌵</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-bold text-lg text-gris-texto hover:text-agave transition line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-gris-suave text-sm mt-1 line-clamp-2">
          {product.description || 'Planta de fácil cuidado'}
        </p>
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xl font-bold text-agave">
            Q{product.base_price.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            className="bg-flor hover:bg-opacity-85 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
