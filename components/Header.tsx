'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import Cart from './Cart'
import { useCartStore } from '@/lib/store'

export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const items = useCartStore((state) => state.items)
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <>
      <header className="bg-agave text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src="/logo.jpg"
                  alt="Florece Logo"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="font-bold text-xl">Florece</h1>
                <p className="text-xs text-arena">Cactus y Suculentas</p>
              </div>
            </Link>

            <nav className="hidden md:flex gap-6">
              <Link href="/" className="hover:text-arena transition">Inicio</Link>
              <Link href="/#cactus" className="hover:text-arena transition">Cactus</Link>
              <Link href="/#suculentas" className="hover:text-arena transition">Suculentas</Link>
              <Link href="/insumos" className="hover:text-arena transition">Insumos</Link>
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative hover:text-arena transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 15v6" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-flor text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
