'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, isCompanyAdmin } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Permission {
  view?: boolean; create?: boolean; edit?: boolean; delete?: boolean;
  edit_basic?: boolean; edit_full?: boolean; edit_salary?: boolean;
  view_salary?: boolean; manage?: boolean; approve?: boolean; process?: boolean;
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
  { key: 'employees', label: 'Employees', icon: '👥', color: 'blue', perms: [
    { key: 'view', label: 'View' }, { key: 'create', label: 'Create' },
    { key: 'edit_basic', label: 'Edit Basic' }, { key: 'edit_full', label: 'Edit Full' },
    { key: 'edit_salary', label: 'Edit Salary' }, { key: 'delete', label: 'Delete' }
  ]},
  { key: 'departments', label: 'Departments', icon: '🏢', color: 'purple', perms: [
    { key: 'view', label: 'View' }, { key: 'create', label: 'Create' },
    { key: 'edit', label: 'Edit' }, { key: 'delete', label: 'Delete' }
  ]},
  { key: 'attendance', label: 'Attendance', icon: '📅', color: 'green', perms: [
    { key: 'view', label: 'View' }, { key: 'manage', label: 'Manage' }
  ]},
  { key: 'leaves', label: 'Leaves', icon: '🌿', color: 'emerald', perms: [
    { key: 'view', label: 'View' }, { key: 'approve', label: 'Approve' }, { key: 'manage', label: 'Manage' }
  ]},
  { key: 'payroll', label: 'Payroll', icon: '💰', color: 'yellow', perms: [
    { key: 'view', label: 'View' }, { key: 'view_salary', label: 'View Salary' },
    { key: 'process', label: 'Process' }, { key: 'approve', label: 'Approve' }
  ]},
  { key: 'reports', label: 'Reports', icon: '📊', color: 'indigo', perms: [
    { key: 'view', label: 'View' }
  ]},
  { key: 'performance', label: 'Performance', icon: '⭐', color: 'orange', perms: [
    { key: 'view', label: 'View' }, { key: 'manage', label: 'Manage' }, { key: 'review', label: 'Review' }
  ]},
  { key: 'recruitment', label: 'Recruitment', icon: '🎯', color: 'pink', perms: [
    { key: 'view', label: 'View' }, { key: 'manage', label: 'Manage' }, { key: 'hire', label: 'Hire' }
  ]},
  { key: 'training', label: 'Training', icon: '📚', color: 'teal', perms: [
    { key: 'view', label: 'View' }, { key: 'manage', label: 'Manage' }, { key: 'assign', label: 'Assign' }
  ]},
  { key: 'documents', label: 'Documents', icon: '📄', color: 'gray', perms: [
    { key: 'view', label: 'View' }, { key: 'upload', label: 'Upload' }, { key: 'delete', label: 'Delete' }
  ]},
];

const EMPTY_PERMISSIONS: Permissions = {
  employees: {}, departments: {}, attendance: {}, leaves: {},
  payroll: {}, reports: {}, performance: {}, recruitment: {}, training: {}, documents: {},
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button onClick={onChange} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
  </button>
);

export default function RolesPage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', scope: 'all', permissions: { ...EMPTY_PERMISSIONS } as Permissions,
  });

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== 'COMPANY_ADMIN') { router.replace('/dashboard'); return; }
    fetchRoles();
  }, [user, authLoading]);

  const fetchRoles = async () => {
    try {
      const token = getToken() || '';
      const data = await apiCall('/roles', {}, token);
      setRoles(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showSuccessMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const togglePerm = (module: string, perm: string) => {
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

  const toggleAllModule = (module: string, perms: string[]) => {
    const modulePerms = (form.permissions as any)[module] || {};
    const allOn = perms.every(p => modulePerms[p]);
    const newPerms: any = {};
    perms.forEach(p => newPerms[p] = !allOn);
    setForm(prev => ({ ...prev, permissions: { ...prev.permissions, [module]: newPerms } }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim()) { setError('Role name is required'); return; }
    try {
      const token = getToken() || '';
      if (isEditing && selectedRole) {
        await apiCall(`/roles/${selectedRole.id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
        showSuccessMsg('Role updated!');
      } else {
        await apiCall('/roles', { method: 'POST', body: JSON.stringify(form) }, token);
        showSuccessMsg('Role created!');
      }
      setShowForm(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = getToken() || '';
      await apiCall(`/roles/${id}`, { method: 'DELETE' }, token);
      setDeleteConfirm(null);
      setSelectedRole(null);
      showSuccessMsg('Role deleted!');
      fetchRoles();
    } catch (err: any) { setError(err.message); }
  };

  const openCreate = () => {
    setForm({ name: '', description: '', scope: 'all', permissions: { ...EMPTY_PERMISSIONS } });
    setIsEditing(false);
    setShowForm(true);
    setSelectedRole(null);
    setError('');
  };

  const openEdit = (role: Role) => {
    setForm({ name: role.name, description: role.description || '', scope: role.scope, permissions: role.permissions || { ...EMPTY_PERMISSIONS } });
    setIsEditing(true);
    setShowForm(true);
    setSelectedRole(role);
    setError('');
  };

  if (authLoading || !user) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      {success && <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">✅ {success}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-500 text-sm mt-1">{roles.length} custom roles · Only Company Admin can manage roles</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
          + Create Role
        </button>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : roles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">🎭</p>
          <p className="text-gray-900 font-semibold mb-1">No custom roles yet</p>
          <p className="text-gray-400 text-sm mb-4">Create roles to assign specific permissions to employees</p>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium">+ Create First Role</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <div key={role.id} onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
              className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all shadow-sm hover:shadow-md ${selectedRole?.id === role.id ? 'border-blue-500' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                      {role.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-gray-900">{role.name}</h3>
                  </div>
                  {role.description && <p className="text-xs text-gray-400 mt-1 ml-10">{role.description}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role.scope === 'all' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {role.scope === 'all' ? 'All Depts' : 'Own Dept'}
                </span>
              </div>

              {/* Permission Summary */}
              <div className="flex flex-wrap gap-1 mb-3">
                {PERMISSION_MODULES.map(mod => {
                  const modPerms = (role.permissions as any)?.[mod.key] || {};
                  const activeCount = mod.perms.filter(p => modPerms[p.key]).length;
                  if (activeCount === 0) return null;
                  return (
                    <span key={mod.key} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {mod.icon} {mod.label} ({activeCount})
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400">{role._count?.employees || 0} employees</span>
                <div className="flex gap-1.5">
                  <button onClick={e => { e.stopPropagation(); openEdit(role); }}
                    className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg">Edit</button>
                  <button onClick={e => { e.stopPropagation(); setDeleteConfirm(role.id); }}
                    className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-lg">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role Detail Panel */}
      {selectedRole && !showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">{selectedRole.name} — Permissions</h2>
              <p className="text-xs text-gray-400 mt-0.5">Scope: {selectedRole.scope === 'all' ? 'All Departments' : 'Own Department Only'}</p>
            </div>
            <button onClick={() => setSelectedRole(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERMISSION_MODULES.map(mod => {
              const modPerms = (selectedRole.permissions as any)?.[mod.key] || {};
              return (
                <div key={mod.key} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3">{mod.icon} {mod.label}</p>
                  <div className="space-y-2">
                    {mod.perms.map(perm => (
                      <div key={perm.key} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 capitalize">{perm.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${modPerms[perm.key] ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-400'}`}>
                          {modPerms[perm.key] ? '✓ On' : 'Off'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">{isEditing ? `Edit Role — ${selectedRole?.name}` : 'Create New Role'}</h3>
              <button onClick={() => { setShowForm(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Role Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. HR Manager, Accountant"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Scope</label>
                  <select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Departments</option>
                    <option value="own_department">Own Department Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this role"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Permissions</label>
                  <button onClick={() => {
                    const allOn = PERMISSION_MODULES.every(mod => mod.perms.every(p => (form.permissions as any)[mod.key]?.[p.key]));
                    const newPerms: any = {};
                    PERMISSION_MODULES.forEach(mod => {
                      newPerms[mod.key] = {};
                      mod.perms.forEach(p => newPerms[mod.key][p.key] = !allOn);
                    });
                    setForm({ ...form, permissions: newPerms });
                  }} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Toggle All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PERMISSION_MODULES.map(mod => {
                    const modPerms = (form.permissions as any)[mod.key] || {};
                    const activeCount = mod.perms.filter(p => modPerms[p.key]).length;
                    const allOn = mod.perms.every(p => modPerms[p.key]);
                    return (
                      <div key={mod.key} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-900">{mod.icon} {mod.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{activeCount}/{mod.perms.length}</span>
                            <button onClick={() => toggleAllModule(mod.key, mod.perms.map(p => p.key))}
                              className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${allOn ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                              {allOn ? 'All On' : 'All Off'}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {mod.perms.map(perm => (
                            <div key={perm.key} className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">{perm.label}</span>
                              <Toggle checked={!!modPerms[perm.key]} onChange={() => togglePerm(mod.key, perm.key)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowForm(false); setError(''); }}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
                <button onClick={handleSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">
                  {isEditing ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Role?</h3>
            <p className="text-sm text-gray-500 mb-5">This will remove the role and unassign it from all employees. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
