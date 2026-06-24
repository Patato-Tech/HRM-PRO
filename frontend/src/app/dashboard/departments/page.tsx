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
    setError("");
    const errors: string[] = [];
    if (!addForm.name.trim()) errors.push("Department name is required.");
    else if (departments.some((d: any) => d.name.toLowerCase() === addForm.name.trim().toLowerCase())) errors.push("A department with this name already exists.");
    if (errors.length > 0) { setError(errors.join(" | ")); return; }
    try {
      const token = getToken() || "";
      await apiCall("/departments", { method: "POST", body: JSON.stringify(addForm) }, token);
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
    if ((selectedDept._count?.employees || 0) > 0) { setError("Cannot delete a department that has employees. Please reassign employees first."); setShowDeleteModal(false); return; }
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
        <div className="fixed top-6 right-6 text-white px-5 py-3.5 rounded-2xl z-50 text-sm font-bold" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 25px rgba(16,185,129,0.4)"}}>
          ✅ {success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Departments</h1>
          <p className="text-gray-400 text-sm mt-0.5">{departments.length} departments in your organization</p>
        </div>
        {canManage && (
          <button onClick={() => { setShowAddModal(true); setError(''); }}
            className="text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>
            + Add Department
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:"Total",value:departments.length,color:"#1d4ed8",bg:"linear-gradient(135deg,#eff6ff,#dbeafe)",border:"#bfdbfe"},
          {label:"Active",value:departments.filter(d=>d.status==='active').length,color:"#059669",bg:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"#bbf7d0"},
          {label:"Inactive",value:departments.filter(d=>d.status==='inactive').length,color:"#dc2626",bg:"linear-gradient(135deg,#fef2f2,#fee2e2)",border:"#fecaca"},
          {label:"Total Employees",value:departments.reduce((sum,d)=>sum+(d._count?.employees||0),0),color:"#7c3aed",bg:"linear-gradient(135deg,#faf5ff,#ede9fe)",border:"#ddd6fe"},
        ].map((s,i) => (
          <div key={i} className="rounded-2xl p-4 border" style={{background:s.bg,borderColor:s.border,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <p className="text-3xl font-black" style={{color:s.color}}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-4 border border-gray-100" style={{boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="Search departments..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50 transition-all" />
        </div>
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
          {filtered.map((dept, i) => (
            <div key={dept.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200 hover:-translate-y-1"
              style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
              {/* Card top accent */}
              <div className="h-1.5 w-full" style={{background:`linear-gradient(135deg,${["#1d4ed8","#7c3aed","#059669","#dc2626","#d97706"][i%5]},${["#3b82f6","#8b5cf6","#10b981","#ef4444","#f59e0b"][i%5]})`}} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg text-white flex-shrink-0"
                      style={{background:`linear-gradient(135deg,${["#1d4ed8","#7c3aed","#059669","#dc2626","#d97706"][i%5]},${["#3b82f6","#8b5cf6","#10b981","#ef4444","#f59e0b"][i%5]})`}}>
                      {dept.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{dept.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Created {new Date(dept.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${dept.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {dept.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{background:"#f8fafc"}}>
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black text-gray-900">{dept._count?.employees || 0}</p>
                    <p className="text-xs text-gray-400 font-medium">Employees</p>
                  </div>
                  {(dept._count?.employees || 0) === 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-400 font-medium">Empty</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleViewDetail(dept)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all text-white"
                    style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                    View Members
                  </button>
                  {canManage && (<>
                    <button onClick={() => openEditModal(dept)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all">
                      Edit
                    </button>
                    <button onClick={() => handleToggleStatus(dept)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${dept.status === 'active' ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {dept.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </>)}
                </div>
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
                  className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
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
              <h3 className="text-lg font-black text-gray-900">Add Department</h3>
              <button onClick={() => { setShowAddModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                <input type="text" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Engineering, HR, Finance"
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowAddModal(false); setError(""); }} className="flex-1 border-2 border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>Create Department</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-gray-900">Edit Department</h3>
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
              <button onClick={() => setShowEditModal(false)} className="flex-1 border-2 border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>Save Changes</button>
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
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 border-2 border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#dc2626,#ef4444)",boxShadow:"0 4px 12px rgba(239,68,68,0.3)"}}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



