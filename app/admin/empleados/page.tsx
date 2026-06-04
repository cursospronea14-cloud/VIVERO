'use client'

import { useEffect, useState } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

interface Employee {
  id: string
  full_name: string
  email: string
  role: string
  branch_id: number
  is_active: boolean
  last_login: string
}

interface Branch {
  id: number
  name: string
}

export default function AdminEmpleados() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'vendedor',
    branch_id: 0,
  })

  const roleNames: Record<string, string> = {
    admin: 'Administrador',
    gerente: 'Gerente',
    vendedor: 'Vendedor POS',
    bodeguero: 'Bodeguero',
    fumigador: 'Fumigador',
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    gerente: 'bg-blue-100 text-blue-700',
    vendedor: 'bg-green-100 text-green-700',
    bodeguero: 'bg-orange-100 text-orange-700',
    fumigador: 'bg-yellow-100 text-yellow-700',
  }

  useEffect(() => {
    fetchEmployees()
    fetchBranches()
  }, [])

  async function fetchEmployees() {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')

    if (profiles) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      const employeesWithEmail = profiles.map(profile => ({
        ...profile,
        email: users?.users.find(u => u.id === profile.id)?.email || '',
      }))
      setEmployees(employeesWithEmail)
    }
    setLoading(false)
  }

  async function fetchBranches() {
    const { data } = await supabase
      .from('branches')
      .select('id, name')
      .order('name')
    if (data) setBranches(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true,
    })

    if (authError) {
      toast.error('Error al crear usuario: ' + authError.message)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        full_name: formData.full_name,
        role: formData.role,
        branch_id: formData.branch_id || null,
        is_active: true,
      }])

    if (profileError) {
      toast.error('Error al crear perfil')
    } else {
      toast.success('Empleado creado')
      fetchEmployees()
      setShowModal(false)
      setFormData({ email: '', password: '', full_name: '', role: 'vendedor', branch_id: 0 })
    }
  }

  async function toggleStatus(employee: Employee) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !employee.is_active })
      .eq('id', employee.id)

    if (error) {
      toast.error('Error al actualizar estado')
    } else {
      toast.success(`Empleado ${employee.is_active ? 'desactivado' : 'activado'}`)
      fetchEmployees()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332]"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Empleados</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Gestiona el personal del vivero</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#1B4332] text-white px-4 py-2 rounded-xl hover:bg-[#2D6A4F] transition flex items-center gap-2"
        >
          <span>+</span>
          Nuevo empleado
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Empleado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Sucursal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1B4332]/10 rounded-full flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">{emp.full_name}</p>
                        <p className="text-xs text-[#6B6B6B]">ID: {emp.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{emp.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${roleColors[emp.role] || 'bg-gray-100'}`}>
                      {roleNames[emp.role] || emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B6B6B]">
                    {branches.find(b => b.id === emp.branch_id)?.name || 'No asignada'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(emp)}
                      className={`px-2 py-1 text-xs rounded-full ${emp.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {emp.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-[#E76F51] hover:text-[#1B4332] transition" title="Editar">
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de nuevo empleado */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-[#E9D8A6] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1B4332]">Nuevo empleado</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl text-[#6B6B6B] hover:text-[#1B4332]">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Correo electrónico *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-xl"
                >
                  <option value="admin">Administrador</option>
                  <option value="gerente">Gerente</option>
                  <option value="vendedor">Vendedor (POS)</option>
                  <option value="bodeguero">Bodeguero</option>
                  <option value="fumigador">Fumigador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1">Sucursal</label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-200 rounded-xl"
                >
                  <option value={0}>Sin asignar</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#1B4332] text-white rounded-xl hover:bg-[#2D6A4F]">Crear empleado</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
