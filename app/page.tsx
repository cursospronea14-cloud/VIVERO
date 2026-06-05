'use client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ProductCard from '@/components/ProductCard'

interface Product {
  id: number
  name: string
  description: string
  base_price: number
  image_url: string
  category_id: number
  is_plant: boolean
  stock: number
  branch_name: string
}

interface Category {
  id: number
  name: string
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState<string>('todas')
  const [uniqueBranches, setUniqueBranches] = useState<string[]>([])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, selectedBranch])

  async function fetchCategories() {
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('display_order')
      if (data) setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  async function fetchProducts() {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          base_price,
          image_url,
          category_id,
          is_plant,
          is_active,
          branch_stock (
            quantity,
            branches (
              name
            )
          )
        `)
        .eq('is_active', true)

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error:', error)
        setProducts([])
      } else if (data) {
        // Procesar productos para mostrar stock por sucursal
        const processedProducts = data.map((product: any) => {
          let totalStock = 0
          let branchName = ''

          if (product.branch_stock && product.branch_stock.length > 0) {
            totalStock = product.branch_stock.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0)
            const availableStock = product.branch_stock.find((stock: any) => stock.quantity > 0)
            if (availableStock) {
              branchName = availableStock.branches?.name || 'Sucursal Principal'
            }
          }

          return {
            ...product,
            stock: totalStock,
            branch_name: branchName
          }
        })

        // Filtrar por sucursal si se selecciona
        let filteredProducts = processedProducts
        if (selectedBranch !== 'todas') {
          filteredProducts = processedProducts.filter(p => p.branch_name === selectedBranch)
        }

        setProducts(filteredProducts)

        // Obtener sucursales únicas para el filtro (forma compatible)
        const branchesMap: Record<string, boolean> = {}
        processedProducts.forEach(p => {
          if (p.branch_name) {
            branchesMap[p.branch_name] = true
          }
        })
        setUniqueBranches(Object.keys(branchesMap))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="text-center py-12 mb-8 bg-arena/30 rounded-2xl">
        <h1 className="text-4xl md:text-5xl font-serif text-agave mb-4">
          Desierto que Florece
        </h1>
        <p className="text-xl text-gris-suave italic">
          "Dios hace florecer el desierto. Isaías 35:1"
        </p>
        <p className="text-gris-suave mt-2">
          Plantas Ornamentales, Cactus y Suculentas
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
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

        {/* Filtro por sucursal */}
        {uniqueBranches.length > 0 && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="todas">📦 Todas las sucursales</option>
            {uniqueBranches.map((branch) => (
              <option key={branch} value={branch}>
                📍 {branch}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-agave"></div>
          <p className="mt-2 text-gris-suave">Cargando productos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gris-suave">
          <p className="text-lg">No hay productos disponibles en esta categoría.</p>
          <p className="text-sm mt-2">Pronto tendremos más variedad para ti.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Sección de información adicional */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 text-center border border-arena">
              <span className="text-4xl block mb-3">🚚</span>
              <h3 className="font-bold text-agave">Envíos a domicilio</h3>
              <p className="text-sm text-gris-suave mt-2">Realizamos envíos a toda Guatemala</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center border border-arena">
              <span className="text-4xl block mb-3">🌿</span>
              <h3 className="font-bold text-agave">Guía de cuidado</h3>
              <p className="text-sm text-gris-suave mt-2">Instructivo de mantenimiento incluido</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center border border-arena">
              <span className="text-4xl block mb-3">💳</span>
              <h3 className="font-bold text-agave">Pago seguro</h3>
              <p className="text-sm text-gris-suave mt-2">Aceptamos efectivo, tarjeta y transferencia</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center border border-arena">
              <span className="text-4xl block mb-3">📦</span>
              <h3 className="font-bold text-agave">Precios por mayoreo</h3>
              <p className="text-sm text-gris-suave mt-2">Descuentos para compras al por mayor</p>
            </div>
          </div>

          {/* Preguntas frecuentes */}
          <div className="mt-12 bg-[#F5F5F0] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-agave text-center mb-6">❓ Preguntas Frecuentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-agave">¿Cómo cuido mi cactus?</h4>
                <p className="text-sm text-gris-suave mt-1">Riega cada 15-20 días, evita encharcamientos. Necesita luz solar indirecta.</p>
              </div>
              <div>
                <h4 className="font-bold text-agave">¿Hacen envíos a mi ciudad?</h4>
                <p className="text-sm text-gris-suave mt-1">Sí, realizamos envíos a toda Guatemala. El costo varía según la zona.</p>
              </div>
              <div>
                <h4 className="font-bold text-agave">¿Puedo facturar mi compra?</h4>
                <p className="text-sm text-gris-suave mt-1">Sí, proporciona tu NIT y razón social en el carrito de compras.</p>
              </div>
              <div>
                <h4 className="font-bold text-agave">¿Qué hago si la planta llega dañada?</h4>
                <p className="text-sm text-gris-suave mt-1">Contáctanos dentro de 24 horas con evidencia y te repondremos el producto.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
