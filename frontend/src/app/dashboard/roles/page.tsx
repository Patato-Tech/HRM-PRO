'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, isCompanyAdmin } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Permission {
  view?: boolean; create?: boolean; edit?: boolean; delete?: boolean;
  manage?: boolean; approve?: boolean; process?: boolean;
  review?: boolean; hire?: boolean; assign?: boolean; upload?: boolean;
}
interface Permissions {
  employees: Permission; departments: Permission; attendance: Permission;
  leaves: Permission; payroll: Permission; reports: Permission;
  performance: Permission; recruitment: Permission; training: Permission;
  documents: Permission;
}
interface Role {
  id: number; name: string; description?: string; isDefault: boolean;
  scope: string; permissions: Permissions; createdAt: string;
  _count?: { employees: number };
}

const PERMISSION_MODULES = [
  { key: 'employees', label: '👥 Employees', perms: ['view', 'create', 'edit', 'delete'] },
  { key: 'departments', label: '🏢 Departments', perms: ['view', 'create', 'edit', 'delete'] },
  { key: 'attendance', label: '📅 Attendance', perms: ['view', 'manage'] },
  { key: 'leaves', label: '🌿 Leaves', perms: ['view', 'approve', 'manage'] },
  { key: 'payroll', label: '💰 Payroll', perms: ['view', 'process', 'approve'] },
  { key: 'reports', label: '📊 Reports', perms: ['view'] },
  { key: 'performance', label: '⭐ Performance', perms: ['view', 'manage', 'review'] },
  { key: 'recruitment', label: '🎯 Recruitment', perms: ['view', 'manage', 'hire'] },
  { key: 'training', label: '📚 Training', perms: ['view', 'manage', 'assign'] },
  { key: 'documents', label: '📄 Documents', perms: ['view', 'upload', 'delete'] },
];

const EMPTY_PERMISSIONS: Permissions = {
  employees: {}, departments: {}, attendance: {}, leaves: {},
  payroll: {}, reports: {}, performance: {}, recruitment: {}, training: {}, documents: {},
};

export default function RolesPage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== 'COMPANY_ADMIN') {
      router.replace('/dashboard');
      return;
    }
    fetchRoles();
  }, [user, authLoading]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', scope: 'all', permissions: EMPTY_PERMISSIONS,
  });

  const canManage = isCompanyAdmin(user?.role || '');


  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const data = await apiCall('/roles', {}, token || '');
      setRoles(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const openCreateModal = () => {
    setEditRole(null);
    setForm({ name: '', description: '', scope: 'all', permissions: EMPTY_PERMISSIONS });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (role: Role) => {
    setEditRole(role);
    setForm({
      name: role.name,
      description: role.description || '',
      scope: role.scope,
      permissions: role.permissions,
    });
    setError('');
    setShowModal(true);
  };

  const togglePermission = (module: string, perm: string) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...(prev.permissions as any)[module],
          [perm]: !(prev.permissions as any)[module]?.[perm],
        },
      },
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Role name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const token = getToken();
      if (editRole) {
        const updated = await apiCall(`/roles/${editRole.id}`, {
          method: 'PUT', body: JSON.stringify(form),
        }, token || '');
        setRoles(prev => prev.map(r => r.id === editRole.id ? { ...r, ...updated } : r));
        showSuccessMsg('Role updated successfully!');
      } else {
        const created = await apiCall('/roles', {
          method: 'POST', body: JSON.stringify(form),
        }, token || '');
        setRoles(prev => [...prev, created]);
        showSuccessMsg('Role created successfully!');
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save role');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    try {
      const token = getToken();
      await apiCall(`/roles/${selectedRole.id}`, { method: 'DELETE' }, token || '');
      setRoles(prev => prev.filter(r => r.id !== selectedRole.id));
      setShowDeleteModal(false);
      showSuccessMsg('Role deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
      setShowDeleteModal(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-500 text-sm mt-1">Create custom roles and assign permissions</p>
        </div>
        {canManage && (
          <button onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
            + Create Role
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{roles.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Roles</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{roles.filter(r => r.isDefault).length}</p>
          <p className="text-xs text-gray-500 mt-1">Default Roles</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{roles.reduce((s, r) => s + (r._count?.employees || 0), 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Assigned Employees</p>
        </div>
      </div>

      {/* Roles List */}
      {roles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-4xl mb-3">🔐</p>
          <p className="text-gray-500 font-medium">No roles created yet</p>
          {canManage && <button onClick={openCreateModal} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm">Create First Role</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <div key={role.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{role.name}</p>
                    {role.isDefault && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                  {role.description && <p className="text-xs text-gray-400 mt-0.5">{role.description}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${role.scope === 'all' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {role.scope === 'all' ? 'All Depts' : 'Own Dept'}
                </span>
              </div>

              {/* Permission summary */}
              <div className="flex flex-wrap gap-1 mb-4">
                {PERMISSION_MODULES.map(mod => {
                  const perms = (role.permissions as any)[mod.key] || {};
                  const activeCount = Object.values(perms).filter(Boolean).length;
                  if (activeCount === 0) return null;
                  return (
                    <span key={mod.key} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {mod.label.split(' ')[0]} {activeCount}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{role._count?.employees || 0} employee(s)</span>
                {canManage && (
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(role)}
                      className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-3 py-1.5 rounded-lg">
                      Edit
                    </button>
                    <button onClick={() => { setSelectedRole(role); setShowDeleteModal(true); }}
                      className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editRole ? 'Edit Role' : 'Create New Role'}</h2>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Finance Manager"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                  <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Departments</option>
                    <option value="own_department">Own Department Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this role"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Permissions</p>
              <div className="space-y-3">
                {PERMISSION_MODULES.map(mod => (
                  <div key={mod.key} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">{mod.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {mod.perms.map(perm => (
                        <label key={perm} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox"
                            checked={(form.permissions as any)[mod.key]?.[perm] || false}
                            onChange={() => togglePermission(mod.key, perm)}
                            className="rounded" />
                          <span className="text-xs text-gray-600 capitalize">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium">
                {saving ? 'Saving...' : (editRole ? 'Update Role' : 'Create Role')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <p className="text-3xl mb-3">⚠️</p>
            <h3 className="font-bold text-gray-900 mb-2">Delete Role?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <strong>{selectedRole.name}</strong>?
              {(selectedRole._count?.employees || 0) > 0 && (
                <span className="text-red-500 block mt-1">{selectedRole._count?.employees} employee(s) assigned to this role.</span>
              )}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
