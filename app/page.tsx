'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ProductCard from '@/components/ProductCard'

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('display_order')
    if (data) setCategories(data)
  }

  async function fetchProducts() {
    setLoading(true)
    
    // Primero obtener productos
    let query = supabase.from('products').select('*').eq('is_active', true)
    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory)
    }
    
    const { data: productsData } = await query
    
    if (productsData) {
      // Para cada producto, obtener su stock
      const productsWithStock = await Promise.all(
        productsData.map(async (product) => {
          const { data: stockData } = await supabase
            .from('branch_stock')
            .select('quantity')
            .eq('product_id', product.id)
            .single()
          
          return {
            ...product,
            stock: stockData?.quantity || 0
          }
        })
      )
      setProducts(productsWithStock)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center py-12 mb-8 bg-arena/30 rounded-2xl">
        <h1 className="text-4xl md:text-5xl font-serif text-agave mb-4">Desierto que Florece</h1>
        <p className="text-xl text-gris-suave italic">"Dios hace florecer el desierto. Isaías 35:1"</p>
        <p className="text-gris-suave mt-2">Plantas Ornamentales, Cactus y Suculentas</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2 rounded-full ${selectedCategory === null ? 'bg-agave text-white' : 'bg-arena'}`}>
          Todos
        </button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-full ${selectedCategory === cat.id ? 'bg-agave text-white' : 'bg-arena'}`}>
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gris-suave">No hay productos disponibles</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
