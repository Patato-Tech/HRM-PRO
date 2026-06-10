'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, hasPermission, isCompanyAdmin } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Department {
  id: string;
  name: string;
  status: string;
}

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  salary?: number;
  status: string;
  joinDate: string;
  roleId?: number;
  department: Department | null;
  customRole?: { id: number; name: string; scope: string; permissions: any; } | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

const ROLES = ['EMPLOYEE'];

const roleColors: Record<string, string> = {
  COMPANY_ADMIN: 'bg-purple-100 text-purple-700',
  COMPANY_ADMIN: 'bg-purple-100 text-purple-700',
  EMPLOYEE: 'bg-green-100 text-green-700',
  EMPLOYEE: 'bg-green-100 text-green-700',
};

export default function EmployeesPage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<{id: number; name: string}[]>([]);

  const [addForm, setAddForm] = useState({
    name: '', email: '', password: '', designation: '',
    departmentId: '', salary: '', role: 'EMPLOYEE', roleId: '',
  });

  const [editForm, setEditForm] = useState({
    name: '', designation: '', departmentId: '', salary: '', status: '', roleId: '',
  });

  // ✅ Reset-password modal state
  const [resetForm, setResetForm] = useState({ newPassword: '', confirm: '' });
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);

  const canView = user?.role === 'COMPANY_ADMIN' || hasPermission(user, 'employees', 'view');
  const canCreate = user?.role === 'COMPANY_ADMIN' || hasPermission(user, 'employees', 'create');
  const canEdit = user?.role === 'COMPANY_ADMIN' || hasPermission(user, 'employees', 'edit');
  const canDelete = user?.role === 'COMPANY_ADMIN' || hasPermission(user, 'employees', 'delete');
  const canManage = canCreate || canEdit || canDelete;
  const hideSalary = !isCompanyAdmin(user?.role || '') && !hasPermission(user, 'payroll', 'view');

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== 'COMPANY_ADMIN' && !hasPermission(user, 'employees', 'view')) {
      router.replace('/dashboard');
      return;
    }
    fetchData();
  }, [user, authLoading]);


  const fetchData = async () => {
    const token = getToken() || '';
    try {
      const empData = await apiCall('/employees', {}, token);
      setEmployees(empData);
    } catch (err) {
      console.error('employees error:', err);
    }
    try {
      const deptData = await apiCall('/departments', {}, token);
      setDepartments(deptData);
    } catch {
      setDepartments([]);
    }
    try {
      const rolesData = await apiCall('/roles', {}, token);
      setRoles(rolesData || []);
    } catch {
      setRoles([]);
    }
    setLoading(false);
  };

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAdd = async () => {
    setError('');
    if (!addForm.name || !addForm.email || !addForm.password) {
      setError('Name, email and password are required');
      return;
    }
    try {
      const token = getToken() || '';
      await apiCall('/employees', {
        method: 'POST',
        body: JSON.stringify({
          ...addForm,
          salary: parseFloat(addForm.salary) || 0,
          roleId: addForm.roleId ? parseInt(addForm.roleId) : null,
        }),
      }, token);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', designation: '', departmentId: '', salary: '', role: 'EMPLOYEE', roleId: '' });
      showSuccessMsg('Employee added successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = async () => {
    setError('');
    if (!selectedEmployee) return;
    try {
      const token = getToken() || '';
      await apiCall(`/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editForm,
          salary: parseFloat(editForm.salary) || 0,
        }),
      }, token);
      setShowEditModal(false);
      showSuccessMsg('Employee updated successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ✅ NEW: admin reset password handler
  const handleResetPassword = async () => {
    setResetError('');
    if (!selectedEmployee) return;
    if (!resetForm.newPassword) { setResetError('New password is required'); return; }
    if (resetForm.newPassword.length < 6) { setResetError('Password must be at least 6 characters'); return; }
    if (resetForm.newPassword !== resetForm.confirm) { setResetError('Passwords do not match'); return; }
    setResetLoading(true);
    try {
      const token = getToken() || '';
      await apiCall(`/employees/${selectedEmployee.id}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword: resetForm.newPassword }),
      }, token);
      setShowResetModal(false);
      setResetForm({ newPassword: '', confirm: '' });
      showSuccessMsg(`Password reset for ${selectedEmployee.user.name}!`);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeactivate = async (emp: Employee) => {
    try {
      const token = getToken() || '';
      if (emp.status === 'active') {
        await apiCall(`/employees/${emp.id}/deactivate`, { method: 'PUT' }, token);
        showSuccessMsg('Employee deactivated!');
      } else {
        await apiCall(`/employees/${emp.id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'active' }),
        }, token);
        showSuccessMsg('Employee activated!');
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      const token = getToken() || '';
      await apiCall(`/employees/${selectedEmployee.id}`, { method: 'DELETE' }, token);
      setShowDeleteModal(false);
      setShowDetailModal(false);
      showSuccessMsg('Employee deleted!');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditForm({
      name: emp.user.name,
      designation: emp.designation || '',
      departmentId: emp.department?.id || '',
      salary: emp.salary != null ? emp.salary.toString() : '',
      status: emp.status,
      roleId: (emp as any).customRole?.id?.toString() || '',
    });
    setShowEditModal(true);
    setError('');
  };

  // ✅ open reset modal
  const openResetModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setResetForm({ newPassword: '', confirm: '' });
    setResetError('');
    setShowResetPw(false);
    setShowResetModal(true);
  };

  const filtered = employees.filter(emp => {
    const matchSearch = emp.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || emp.status === statusFilter;
    const matchDept = deptFilter === 'all' || emp.department?.id === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Success Toast */}
      {success && (
        <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">{employees.length} total employees</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setShowAddModal(true); setError(''); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            + Add Employee
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'Total Staff', value: employees.length, color: 'text-gray-900', bg: 'bg-blue-50' },
          { label: 'Active', value: employees.filter(e => e.status === 'active').length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Inactive', value: employees.filter(e => e.status === 'inactive').length, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'With Custom Role', value: employees.filter(e => (e as any).customRole).length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'No Role Assigned', value: employees.filter(e => !(e as any).customRole).length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Employees', value: employees.filter(e => e.user.role === 'EMPLOYEE').length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Departments', value: departments.length, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name, email, code, designation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Employee', 'Code', 'Designation', 'Department', ...(!hideSalary ? ['Salary'] : []), 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={hideSalary ? 7 : 8} className="px-6 py-16 text-center">
                    <div className="text-4xl mb-3">👥</div>
                    <p className="text-gray-500 font-medium">No employees found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                          {emp.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{emp.user.name}</p>
                          <p className="text-xs text-gray-400">{emp.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{emp.employeeCode}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{emp.designation || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{emp.department?.name || '—'}</td>
                    {!hideSalary && (
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {emp.salary != null ? `PKR ${emp.salary.toLocaleString()}` : '—'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${(emp as any).customRole ? 'bg-blue-100 text-blue-700' : (roleColors[emp.user?.role] || 'bg-gray-100 text-gray-600')}`}>
                        {(emp as any).customRole?.name || emp.user?.role?.replace(/_/g, ' ') || 'Employee'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => { setSelectedEmployee(emp); setShowDetailModal(true); }}
                          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg"
                        >
                          View
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => openEditModal(emp)}
                              className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg"
                            >
                              Edit
                            </button>
                            {/* ✅ Reset Password button */}
                            <button
                              onClick={() => openResetModal(emp)}
                              className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg"
                            >
                              Reset Pwd
                            </button>
                            {emp.user.id !== user?.id && (
                            <button
                              onClick={() => handleDeactivate(emp)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg ${emp.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            >
                              {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            )}
                            {canDelete && emp.user.id !== user?.id && (
                            <button
                              onClick={() => { setSelectedEmployee(emp); setShowDeleteModal(true); }}
                              className="text-xs bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 px-2.5 py-1.5 rounded-lg"
                            >
                              Delete
                            </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Employee Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="flex items-center gap-4 mb-5 p-4 bg-blue-50 rounded-2xl">
              <div className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl">
                {selectedEmployee.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{selectedEmployee.user.name}</p>
                <p className="text-sm text-gray-500">{selectedEmployee.user.email}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${selectedEmployee.customRole ? 'bg-blue-100 text-blue-700' : (roleColors[selectedEmployee.user.role] || 'bg-gray-100 text-gray-600')}`}>
                  {selectedEmployee.customRole?.name || selectedEmployee.user.role.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Employee Code', value: selectedEmployee.employeeCode },
                { label: 'Status', value: selectedEmployee.status, badge: true },
                { label: 'Designation', value: selectedEmployee.designation || '—' },
                { label: 'Department', value: selectedEmployee.department?.name || '—' },
                ...(!hideSalary ? [{ label: 'Salary', value: selectedEmployee.salary != null ? `PKR ${selectedEmployee.salary.toLocaleString()}` : '—' }] : []),
                { label: 'Join Date', value: new Date(selectedEmployee.joinDate).toLocaleDateString() },
              ].map((item: any, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  {item.badge ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${selectedEmployee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.value}
                    </span>
                  ) : (
                    <p className="text-gray-900 font-semibold text-sm">{item.value}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowDetailModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Close</button>
              {canManage && (
                <>
                  <button onClick={() => { setShowDetailModal(false); openEditModal(selectedEmployee); }} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl text-sm font-medium">Edit</button>
                  {selectedEmployee.user.id !== user?.id && canDelete && (
                  <button onClick={() => { setShowDetailModal(false); setShowDeleteModal(true); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium">Delete</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Employee</h3>
              <button onClick={() => { setShowAddModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="John Doe" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="john@company.com" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="••••••••" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input type="text" value={addForm.designation} onChange={e => setAddForm({ ...addForm, designation: e.target.value })}
                    placeholder="Software Engineer" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select value={addForm.departmentId} onChange={e => setAddForm({ ...addForm, departmentId: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    <option value="">No Department</option>
                    {departments.filter(d => d.status === 'active').map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary (PKR)</label>
                  <input type="number" value={addForm.salary} onChange={e => setAddForm({ ...addForm, salary: e.target.value })}
                    placeholder="50000" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Custom Role <span className="text-gray-400 font-normal">(optional)</span></label>
                <select value={addForm.roleId} onChange={e => setAddForm({ ...addForm, roleId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="">No Custom Role</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowAddModal(false); setError(''); }} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleAdd} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Add Employee</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Employee</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input type="text" value={editForm.designation} onChange={e => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                {!hideSalary && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary (PKR)</label>
                    <input type="number" value={editForm.salary} onChange={e => setEditForm({ ...editForm, salary: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select value={editForm.departmentId} onChange={e => setEditForm({ ...editForm, departmentId: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    <option value="">No Department</option>
                    {departments.filter(d => d.status === 'active').map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEditModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ RESET PASSWORD MODAL */}
      {showResetModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
              <button onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="bg-indigo-50 rounded-xl p-3 mb-4">
              <p className="font-semibold text-gray-900 text-sm">{selectedEmployee.user.name}</p>
              <p className="text-xs text-gray-500">{selectedEmployee.user.email}</p>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              You're setting a new password directly. Share it with the employee — they can change it later from their Profile.
            </p>

            {resetError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{resetError}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showResetPw ? 'text' : 'password'}
                    value={resetForm.newPassword}
                    onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <button type="button" onClick={() => setShowResetPw(!showResetPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                    {showResetPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type={showResetPw ? 'text' : 'password'}
                  value={resetForm.confirm}
                  onChange={e => setResetForm({ ...resetForm, confirm: e.target.value })}
                  placeholder="Re-enter new password"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowResetModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium"
              >
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Employee?</h3>
            <p className="text-gray-500 text-sm mb-1">You are about to delete</p>
            <p className="font-bold text-gray-900 mb-4">"{selectedEmployee.user.name}"</p>
            <p className="text-red-500 text-xs mb-6">This will permanently remove the employee and their user account.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-medium">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}