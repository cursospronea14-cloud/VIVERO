'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface Config {
  business_name: string
  iva_rate: number
  isr_rate: number
  exchange_rate: number
  phone: string
  email: string
  address: string
}

export default function AdminConfiguracion() {
  const [config, setConfig] = useState<Config>({
    business_name: 'Florece - Cactus y Suculentas',
    iva_rate: 12,
    isr_rate: 5,
    exchange_rate: 7.85,
    phone: '',
    email: '',
    address: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    // Intentar cargar desde una tabla de configuraciones (si existe)
    const { data } = await supabase
      .from('app_settings')
      .select('*')
      .single()
    
    if (data) {
      setConfig({
        business_name: data.business_name || config.business_name,
        iva_rate: data.iva_rate || config.iva_rate,
        isr_rate: data.isr_rate || config.isr_rate,
        exchange_rate: data.exchange_rate || config.exchange_rate,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
      })
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        business_name: config.business_name,
        iva_rate: config.iva_rate,
        isr_rate: config.isr_rate,
        exchange_rate: config.exchange_rate,
        phone: config.phone,
        email: config.email,
        address: config.address,
      })
    
    if (error) {
      toast.error('Error al guardar configuración')
    } else {
      toast.success('Configuración guardada')
    }
    setSaving(false)
  }

  if (loading) return <div className="text-center py-12">Cargando...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gris-texto mb-6">Configuración</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del negocio</label>
          <input
            type="text"
            value={config.business_name}
            onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
            className="w-full p-2 border rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">IVA (%)</label>
            <input
              type="number"
              step="0.01"
              value={config.iva_rate}
              onChange={(e) => setConfig({ ...config, iva_rate: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ISR (%)</label>
            <input
              type="number"
              step="0.01"
              value={config.isr_rate}
              onChange={(e) => setConfig({ ...config, isr_rate: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo de cambio (USD a GTQ)</label>
          <input
            type="number"
            step="0.01"
            value={config.exchange_rate}
            onChange={(e) => setConfig({ ...config, exchange_rate: parseFloat(e.target.value) })}
            className="w-full p-2 border rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              type="tel"
              value={config.phone}
              onChange={(e) => setConfig({ ...config, phone: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <textarea
            value={config.address}
            onChange={(e) => setConfig({ ...config, address: e.target.value })}
            className="w-full p-2 border rounded-lg"
            rows={3}
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-agave text-white px-6 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  )
}
