'use client'

import Link from 'next/link'
import { useCartStore } from '@/lib/store'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function ProductCard({ product }: { product: any }) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)
  const stock = product.stock || 0

  const handleAddToCart = () => {
    if (stock === 0) {
      toast.error('Producto agotado')
      return
    }
    if (quantity > stock) {
      toast.error(`Solo hay ${stock} unidades disponibles`)
      return
    }
    addItem({ id: product.id, name: product.name, price: product.base_price, quantity })
    toast.success(`Agregado: ${quantity}x ${product.name}`)
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
      <Link href={`/product/${product.id}`}>
        <div className="h-48 w-full overflow-hidden bg-gray-100">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-arena">
              <span className="text-6xl">🌵</span>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-bold text-lg hover:text-agave">{product.name}</h3>
        </Link>
        <p className="text-gray-500 text-sm mt-1">{product.description || 'Planta de fácil cuidado'}</p>
        
        {/* Stock visible */}
        <div className="mt-2">
          {stock > 0 ? (
            <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              ✅ {stock} unidades disponibles
            </span>
          ) : (
            <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">❌ Agotado</span>
          )}
        </div>

        <div className="mt-3 flex justify-between items-center">
          <span className="text-xl font-bold text-agave">Q{product.base_price?.toFixed(2)}</span>
          {stock > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 py-1 border rounded">-</button>
              <span className="w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(stock, quantity + 1))} className="px-2 py-1 border rounded">+</button>
            </div>
          )}
          <button
            onClick={handleAddToCart}
            disabled={stock === 0}
            className={`px-4 py-2 rounded-lg font-semibold ${stock === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-flor text-white hover:bg-flor/85'}`}
          >
            {stock === 0 ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}
