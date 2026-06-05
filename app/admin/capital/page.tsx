'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface Expense {
  id: number
  description: string
  category: string
  amount: number
  expense_date: string
  created_at: string
}

export default function AdminGastos() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    description: '',
    category: 'services',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
  })

  const categories = [
    { value: 'services', label: 'Servicios (luz, agua, internet)', icon: '💡' },
    { value: 'salaries', label: 'Salarios y nómina', icon: '👥' },
    { value: 'rent', label: 'Alquiler de local', icon: '🏢' },
    { value: 'marketing', label: 'Publicidad y marketing', icon: '📢' },
    { value: 'supplies', label: 'Insumos y materiales', icon: '📦' },
    { value: 'maintenance', label: 'Mantenimiento', icon: '🔧' },
    { value: 'transport', label: 'Transporte y envíos', icon: '🚚' },
    { value: 'other', label: 'Otros gastos', icon: '📝' },
  ]

  useEffect(() => {
    fetchExpenses()
  }, [])

  async function fetchExpenses() {
    const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false })
    if (data) {
      setExpenses(data)
      const total = data.reduce((sum, item) => sum + item.amount, 0)
      setTotalExpenses(total)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('expenses').insert({
      description: formData.description,
      category: formData.category,
      amount: formData.amount,
      expense_date: formData.expense_date,
      created_by: user?.id,
    })
    
    if (error) {
      toast.error('Error al registrar gasto')
    } else {
      toast.success('Gasto registrado')
      fetchExpenses()
      setFormData({ description: '', category: 'services', amount: 0, expense_date: new Date().toISOString().split('T')[0] })
    }
  }

  async function handleDelete(id: number) {
    if (confirm('¿Eliminar este gasto?')) {
      await supabase.from('expenses').delete().eq('id', id)
      toast.success('Gasto eliminado')
      fetchExpenses()
    }
  }

  const getCategoryIcon = (category: string) => {
    return categories.find(c => c.value === category)?.icon || '📝'
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332]"></div></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B4332]">Control de Gastos</h1>
        <p className="text-gray-500 text-sm">Registro de gastos operativos del negocio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-[#1B4332] mb-4">➕ Registrar nuevo gasto</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Descripción *</label>
              <input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border rounded-xl" placeholder="Ej: Pago de luz mensual" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full p-2 border rounded-xl">
                {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monto (GTQ) *</label>
              <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="w-full p-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha del gasto</label>
              <input type="date" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} className="w-full p-2 border rounded-xl" />
            </div>
            <button type="submit" className="w-full bg-[#1B4332] text-white py-2 rounded-xl">Registrar gasto</button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-[#1B4332] mb-4">📊 Resumen de Gastos</h2>
          <div className="text-center p-6 bg-gray-50 rounded-xl mb-4">
            <p className="text-sm text-gray-500">Total de gastos registrados</p>
            <p className="text-3xl font-bold text-[#E76F51]">Q{totalExpenses.toFixed(2)}</p>
          </div>
          <h3 className="font-medium mb-3">Historial de gastos</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex justify-between items-center border-b pb-2 hover:bg-gray-50 p-2 rounded">
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-xs text-gray-500">{getCategoryIcon(expense.category)} {expense.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#E76F51]">Q{expense.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{new Date(expense.expense_date).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleDelete(expense.id)} className="text-red-500 text-sm ml-2">🗑️</button>
              </div>
            ))}
            {expenses.length === 0 && <p className="text-center text-gray-500 py-4">No hay gastos registrados</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
