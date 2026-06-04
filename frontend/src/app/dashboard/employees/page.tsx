'use client';

import { useEffect, useState } from 'react';
import { useAuth, canManageEmployees, isDeptManager, isEmployee, isCompanyAdmin, isHRManager } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Department { id: string; name: string; }

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  salary?: number;
  status: string;
  joinDate: string;
  department: Department | null;
  user: { id: string; name: string; email: string; role: string; isActive: boolean; };
}

const ROLES = ['EMPLOYEE', 'HR_MANAGER', 'DEPT_MANAGER'];

const roleColors: Record<string, string> = {
  COMPANY_ADMIN: 'bg-purple-100 text-purple-700',
  HR_MANAGER: 'bg-blue-100 text-blue-700',
  DEPT_MANAGER: 'bg-yellow-100 text-yellow-700',
  EMPLOYEE: 'bg-green-100 text-green-700',
};

export default function EmployeesPage() {
  const { user } = useAuth(false);
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
  const [showIncrementModal, setShowIncrementModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', designation: '', departmentId: '', salary: '', role: 'EMPLOYEE' });
  const [editForm, setEditForm] = useState({ name: '', designation: '', departmentId: '', salary: '', status: '' });
  const [resetForm, setResetForm] = useState({ newPassword: '', confirm: '' });
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState('');
  const [incrementLoading, setIncrementLoading] = useState(false);

  const role = user?.role || '';
  const isEmp = isEmployee(role);
  const isDeptMgr = isDeptManager(role);
  const canAdd = isCompanyAdmin(role) || isHRManager(role);
  const canManage = canManageEmployees(role) && !isEmp;
  const hideSalary = isDeptMgr || isEmp;
  const canIncrement = isCompanyAdmin(role) || isHRManager(role);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const token = getToken() || '';
    try {
      const [empData, deptData] = await Promise.all([
        apiCall('/employees', {}, token),
        apiCall('/departments', {}, token),
      ]);
      setEmployees(empData || []);
      setDepartments(deptData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showSuccessMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleAdd = async () => {
    setError('');
    if (!addForm.name || !addForm.email || !addForm.password) { setError('Name, email and password are required'); return; }
    try {
      const token = getToken() || '';
      await apiCall('/employees', { method: 'POST', body: JSON.stringify({ ...addForm, salary: parseFloat(addForm.salary) || 0 }) }, token);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', designation: '', departmentId: '', salary: '', role: 'EMPLOYEE' });
      showSuccessMsg('Employee added!');
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleEdit = async () => {
    setError('');
    if (!selectedEmployee) return;
    try {
      const token = getToken() || '';
      await apiCall(`/employees/${selectedEmployee.id}`, { method: 'PUT', body: JSON.stringify({ ...editForm, salary: parseFloat(editForm.salary) || 0 }) }, token);
      setShowEditModal(false);
      showSuccessMsg('Employee updated!');
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleResetPassword = async () => {
    setResetError('');
    if (!resetForm.newPassword) { setResetError('Password is required'); return; }
    if (resetForm.newPassword.length < 6) { setResetError('Minimum 6 characters'); return; }
    if (resetForm.newPassword !== resetForm.confirm) { setResetError('Passwords do not match'); return; }
    setResetLoading(true);
    try {
      const token = getToken() || '';
      await apiCall(`/employees/${selectedEmployee!.id}/reset-password`, { method: 'PUT', body: JSON.stringify({ newPassword: resetForm.newPassword }) }, token);
      setShowResetModal(false);
      setResetForm({ newPassword: '', confirm: '' });
      showSuccessMsg(`Password reset for ${selectedEmployee!.user.name}!`);
    } catch (err: any) { setResetError(err.message); }
    finally { setResetLoading(false); }
  };

  const handleIncrement = async () => {
    setError('');
    const amount = parseFloat(incrementAmount);
    if (!amount || amount <= 0) { setError('Enter a valid positive amount'); return; }
    setIncrementLoading(true);
    try {
      const token = getToken() || '';
      await apiCall(`/employees/${selectedEmployee!.id}/increment`, { method: 'PUT', body: JSON.stringify({ amount }) }, token);
      setShowIncrementModal(false);
      setIncrementAmount('');
      showSuccessMsg(`Salary incremented by PKR ${amount.toLocaleString()} for ${selectedEmployee!.user.name}!`);
      fetchData();
    } catch (err: any) { setError(err.message); }
    finally { setIncrementLoading(false); }
  };

  const handleDeactivate = async (emp: Employee) => {
    try {
      const token = getToken() || '';
      if (emp.status === 'active') {
        await apiCall(`/employees/${emp.id}/deactivate`, { method: 'PUT' }, token);
        showSuccessMsg('Employee deactivated!');
      } else {
        await apiCall(`/employees/${emp.id}`, { method: 'PUT', body: JSON.stringify({ status: 'active' }) }, token);
        showSuccessMsg('Employee activated!');
      }
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      const token = getToken() || '';
      await apiCall(`/employees/${selectedEmployee.id}`, { method: 'DELETE' }, token);
      setShowDeleteModal(false);
      showSuccessMsg('Employee deleted!');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditForm({ name: emp.user.name, designation: emp.designation || '', departmentId: emp.department?.id || '', salary: emp.salary != null ? emp.salary.toString() : '', status: emp.status });
    setShowEditModal(true);
    setError('');
  };

  const filtered = employees.filter(emp => {
    const matchSearch = emp.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || emp.status === statusFilter;
    const matchDept = deptFilter === 'all' || emp.department?.id === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  // ✅ EMPLOYEE: sees only their own card
  if (isEmp) {
    const me = employees[0];
    if (!me) return <div className="text-center py-16 text-gray-400">No profile data found.</div>;
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {me.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{me.user.name}</h2>
              <p className="text-gray-500">{me.user.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${roleColors[me.user.role]}`}>
                {me.user.role.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Employee Code', value: me.employeeCode },
              { label: 'Designation', value: me.designation || '—' },
              { label: 'Department', value: me.department?.name || '—' },
              { label: 'Status', value: me.status },
              { label: 'Joined', value: new Date(me.joinDate).toLocaleDateString() },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {success && <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">✅ {success}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">{employees.length} total employees</p>
        </div>
        {/* ✅ Only Company Admin and HR Manager can add */}
        {canAdd && (
          <button onClick={() => { setShowAddModal(true); setError(''); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
            + Add Employee
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: employees.length, color: 'text-gray-900', bg: 'bg-blue-50' },
          { label: 'Active', value: employees.filter(e => e.status === 'active').length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Inactive', value: employees.filter(e => e.status === 'inactive').length, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Departments', value: departments.length, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Search by name, email, code..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {!isDeptMgr && (
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Employee', 'Code', 'Designation', 'Department', ...(!hideSalary ? ['Salary'] : []), 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center"><p className="text-3xl mb-3">👥</p><p className="text-gray-500">No employees found</p></td></tr>
              ) : (
                filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50">
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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleColors[emp.user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {emp.user.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button onClick={() => { setSelectedEmployee(emp); setShowDetailModal(true); }}
                          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg">View</button>
                        {canManage && !isDeptMgr && (
                          <button onClick={() => openEditModal(emp)}
                            className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg">Edit</button>
                        )}
                        {canManage && (
                          <button onClick={() => { setSelectedEmployee(emp); setResetForm({ newPassword: '', confirm: '' }); setResetError(''); setShowResetModal(true); }}
                            className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg">Reset Pwd</button>
                        )}
                        {/* ✅ Salary increment — Admin + HR only */}
                        {canIncrement && (
                          <button onClick={() => { setSelectedEmployee(emp); setIncrementAmount(''); setShowIncrementModal(true); setError(''); }}
                            className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg">Increment</button>
                        )}
                        {canAdd && (
                          <>
                            <button onClick={() => handleDeactivate(emp)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg ${emp.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                              {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => { setSelectedEmployee(emp); setShowDeleteModal(true); }}
                              className="text-xs bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 px-2.5 py-1.5 rounded-lg">Delete</button>
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
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleColors[selectedEmployee.user.role] || 'bg-gray-100'}`}>
                  {selectedEmployee.user.role.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Employee Code', value: selectedEmployee.employeeCode },
                { label: 'Status', value: selectedEmployee.status, badge: true },
                { label: 'Designation', value: selectedEmployee.designation || '—' },
                { label: 'Department', value: selectedEmployee.department?.name || '—' },
                ...(!hideSalary && selectedEmployee.salary != null ? [{ label: 'Salary', value: `PKR ${selectedEmployee.salary.toLocaleString()}` }] : []),
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
              {canAdd && (
                <button onClick={() => { setShowDetailModal(false); openEditModal(selectedEmployee); }}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl text-sm font-medium">Edit</button>
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
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input type="text" value={addForm.designation} onChange={e => setAddForm({ ...addForm, designation: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select value={addForm.departmentId} onChange={e => setAddForm({ ...addForm, departmentId: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    <option value="">No Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary (PKR)</label>
                  <input type="number" value={addForm.salary} onChange={e => setAddForm({ ...addForm, salary: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select value={editForm.departmentId} onChange={e => setEditForm({ ...editForm, departmentId: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    <option value="">No Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
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

      {/* RESET PASSWORD MODAL */}
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
            {resetError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{resetError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                <input type="password" value={resetForm.newPassword} onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input type="password" value={resetForm.confirm} onChange={e => setResetForm({ ...resetForm, confirm: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowResetModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleResetPassword} disabled={resetLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium">
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ SALARY INCREMENT MODAL */}
      {showIncrementModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Salary Increment</h3>
              <button onClick={() => setShowIncrementModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 mb-4">
              <p className="font-semibold text-gray-900 text-sm">{selectedEmployee.user.name}</p>
              <p className="text-xs text-gray-500">
                Current Salary: {selectedEmployee.salary != null ? `PKR ${selectedEmployee.salary.toLocaleString()}` : 'N/A'}
              </p>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Increment Amount (PKR) *</label>
              <input type="number" value={incrementAmount} onChange={e => setIncrementAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              {incrementAmount && selectedEmployee.salary != null && (
                <div className="mt-3 bg-green-50 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Salary</span>
                  <span className="font-bold text-green-600">
                    PKR {(selectedEmployee.salary + (parseFloat(incrementAmount) || 0)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowIncrementModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleIncrement} disabled={incrementLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium">
                {incrementLoading ? 'Applying...' : '📈 Apply Increment'}
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
            <p className="font-bold text-gray-900 mb-4">"{selectedEmployee.user.name}"</p>
            <p className="text-red-500 text-xs mb-6">This permanently removes the employee and their account.</p>
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
