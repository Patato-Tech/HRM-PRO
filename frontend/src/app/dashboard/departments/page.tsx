'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, canManageDepartments , hasPermission } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  user: { name: string; email: string; role: string };
  customRole?: { name: string } | null;
}
const ROLE_BADGES: Record<string, string> = {
  COMPANY_ADMIN: 'bg-purple-100 text-purple-700',
  EMPLOYEE: 'bg-green-100 text-green-700',
};

const ROLE_LABELS: Record<string, string> = {
  COMPANY_ADMIN: 'Company Admin',
  EMPLOYEE: 'Employee',
};

interface Department {
  id: string;
  name: string;
  headId: string | null;
  createdAt: string;
  status: string;
  _count: { employees: number };
  employees?: Employee[];
}

export default function DepartmentsPage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [addForm, setAddForm] = useState({ name: '', headId: '' });
  const [editForm, setEditForm] = useState({ name: '', headId: '' });

  const canManage = canManageDepartments(user?.role || '');


  // ✅ Page permission guard
  useEffect(() => {
    if (!authLoading && user && user.role !== 'COMPANY_ADMIN' && !hasPermission(user, 'departments', 'view')) {
      router.replace('/dashboard');
    }
  }, [user]);
  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const token = getToken() || '';
      const data = await apiCall('/departments', {}, token);
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAdd = async () => {
    setError('');
    if (!addForm.name) { setError('Department name is required'); return; }
    try {
      const token = getToken() || '';
      await apiCall('/departments', {
        method: 'POST',
        body: JSON.stringify(addForm),
      }, token);
      setShowAddModal(false);
      setAddForm({ name: '', headId: '' });
      showSuccessMsg('Department created successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = async () => {
    setError('');
    if (!selectedDept) return;
    try {
      const token = getToken() || '';
      await apiCall(`/departments/${selectedDept.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      }, token);
      setShowEditModal(false);
      showSuccessMsg('Department updated successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedDept) return;
    try {
      const token = getToken() || '';
      await apiCall(`/departments/${selectedDept.id}`, { method: 'DELETE' }, token);
      setShowDeleteModal(false);
      setShowDetailModal(false);
      showSuccessMsg('Department deleted successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (dept: Department) => {
    try {
      const token = getToken();
      const res = await apiCall(`/departments/${dept.id}/toggle-status`, { method: 'PUT' }, token || '');
      setDepartments(prev => prev.map(d => d.id === dept.id ? { ...d, status: res.status } : d));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleViewDetail = async (dept: Department) => {
    setSelectedDept(dept);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const token = getToken() || '';
      const data = await apiCall(`/departments/${dept.id}`, {}, token);
      setSelectedDept(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const openEditModal = (dept: Department) => {
    setSelectedDept(dept);
    setEditForm({ name: dept.name, headId: dept.headId || '' });
    setShowEditModal(true);
    setError('');
  };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 text-sm mt-1">{departments.length} departments</p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowAddModal(true); setError(''); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            + Add Department
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{departments.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Departments</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{departments.filter(d => d.status === 'active').length}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-red-500">{departments.filter(d => d.status === 'inactive').length}</p>
          <p className="text-xs text-gray-500 mt-1">Inactive</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-purple-600">
            {departments.reduce((sum, d) => sum + (d._count?.employees || 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total Employees</p>
          <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {departments.flatMap(d => d.employees || []).map((emp: any) => (
              <span key={emp.id} className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${emp.customRole ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {emp.customRole?.name || 'Employee'}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <input
          type="text"
          placeholder="Search departments..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
      </div>

      {/* Department Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-gray-500 font-medium">No departments found</p>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm"
            >
              Create First Department
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(dept => (
            <div key={dept.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-700 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg">
                    {dept.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{dept.name}</p>
                    <p className="text-xs text-gray-400">
                      Created {new Date(dept.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="bg-gray-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-xl font-bold text-gray-900">{dept._count?.employees || 0}</p>
                  <p className="text-xs text-gray-500">Employees</p>
                </div>
                <div className="flex gap-1">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${dept.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {dept.status}
                  </span>
                  {(dept._count?.employees || 0) === 0 && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-500">Empty</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetail(dept)}
                  className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-xl text-xs font-medium transition-colors"
                >
                  View Members
                </button>
                {canManage && (
                  <>
                    <button
                      onClick={() => openEditModal(dept)}
                      className="flex-1 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 py-2 rounded-xl text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(dept)}
                      className={`px-3 py-2 rounded-xl text-xs transition-colors ${dept.status === 'active' ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {dept.status === 'active' ? '⏸️' : '▶️'}
                    </button>
                    <button
                      onClick={() => { setSelectedDept(dept); setShowDeleteModal(true); }}
                      className="bg-red-50 text-red-500 hover:bg-red-100 px-3 py-2 rounded-xl text-xs transition-colors"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedDept.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedDept.employees?.length || 0} members</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedDept.employees?.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">👥</p>
                <p className="text-gray-400 text-sm">No employees in this department</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDept.employees?.map(emp => (
                  <div key={emp.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                      {emp.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{emp.user.name}</p>
                      <p className="text-xs text-gray-400">{emp.designation || 'No designation'} • {emp.employeeCode}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${(emp as any).customRole ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {(emp as any).customRole?.name || 'Employee'}
                      </span>
                      <p className="text-xs text-gray-400">{emp.user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowDetailModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Close</button>
              {canManage && (
                <button onClick={() => { setShowDetailModal(false); openEditModal(selectedDept); }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">
                  Edit Department
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Department</h3>
              <button onClick={() => { setShowAddModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                <input type="text" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Engineering, HR, Finance"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowAddModal(false); setError(''); }} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleAdd} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Create Department</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Department</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEditModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && selectedDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Department?</h3>
            <p className="text-gray-500 text-sm mb-1">You are about to delete</p>
            <p className="font-bold text-gray-900 mb-2">"{selectedDept.name}"</p>
            <p className="text-red-500 text-xs mb-6">
              Employees in this department will be unassigned but not deleted.
            </p>
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