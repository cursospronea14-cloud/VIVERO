'use client'
// Al inicio del archivo, después de los imports
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ProductCard from '@/components/ProductCard'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  description: string
  base_price: number
  image_url: string
  category_id: number
  is_plant: boolean
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('display_order')
    if (data) setCategories(data)
  }

  async function fetchProducts() {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory)
    }

    const { data } = await query
    if (data) setProducts(data)
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section con versículo */}
      <div className="text-center py-12 mb-8 bg-arena/30 rounded-2xl">
        <h1 className="text-4xl md:text-5xl font-serif text-agave mb-4">
          Florece - Cactus y Suculentas
        </h1>
        <p className="text-xl text-gris-suave italic">
          "Dios hace florecer el desierto. Isaías 35:1"
        </p>
        <p className="text-gris-suave mt-2">
          Plantas que resisten la sequía o de poco consumo de agua
        </p>
      </div>

      {/* Filtro de categorías */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full transition-all ${
            selectedCategory === null
              ? 'bg-agave text-white'
              : 'bg-arena text-gris-texto hover:bg-agave/20'
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full transition-all ${
              selectedCategory === cat.id
                ? 'bg-agave text-white'
                : 'bg-arena text-gris-texto hover:bg-agave/20'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-agave"></div>
          <p className="mt-2 text-gris-suave">Cargando productos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gris-suave">
          No hay productos disponibles en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
