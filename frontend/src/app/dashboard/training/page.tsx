'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, isCompanyAdmin, hasPermission } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Department { id: string; name: string; }
interface Employee { id: string; employeeCode: string; user: { name: string }; department?: { name: string } | null; }
interface Enrollment { id: string; status: string; completedAt: string | null; employee: { id: string; user: { name: string } }; }

interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  trainerName: string;
  startDate: string;
  endDate: string;
  maxParticipants: number | null;
  status: string;
  department?: { name: string } | null;
  createdBy: { name: string };
  enrollments: Enrollment[];
}

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

const ENROLLMENT_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function TrainingPage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [enrollEmployeeId, setEnrollEmployeeId] = useState('');
  const [enrollDeptFilter, setEnrollDeptFilter] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', trainerName: '', departmentId: '',
    startDate: '', endDate: '', maxParticipants: '',
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'COMPANY_ADMIN' && !hasPermission(user, 'training', 'view')) {
      router.replace('/dashboard');
    }
  }, [user]);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    const token = getToken() || '';
    try {
      const [progsData, empsData, deptsData] = await Promise.all([
        apiCall('/training', {}, token),
        apiCall('/employees', {}, token),
        apiCall('/departments', {}, token),
      ]);
      setPrograms(progsData || []);
      setEmployees(empsData || []);
      setDepartments(deptsData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showSuccessMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleAdd = async () => {
    setError('');
    if (!form.title || !form.startDate || !form.endDate) { setError('Title, start date and end date are required'); return; }
    try {
      const token = getToken() || '';
      await apiCall('/training', { method: 'POST', body: JSON.stringify(form) }, token);
      setShowAddModal(false);
      setForm({ title: '', description: '', trainerName: '', departmentId: '', startDate: '', endDate: '', maxParticipants: '' });
      showSuccessMsg('Training program created!');
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const token = getToken() || '';
      await apiCall(`/training/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }, token);
      showSuccessMsg('Status updated!');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this training program?')) return;
    try {
      const token = getToken() || '';
      await apiCall(`/training/${id}`, { method: 'DELETE' }, token);
      showSuccessMsg('Training deleted!');
      fetchData();
      setShowViewModal(false);
    } catch (err) { console.error(err); }
  };

  const handleEnroll = async () => {
    if (!enrollEmployeeId) { setError('Select an employee'); return; }
    try {
      const token = getToken() || '';
      await apiCall(`/training/${selectedProgram?.id}/enroll`, {
        method: 'POST', body: JSON.stringify({ employeeId: enrollEmployeeId }),
      }, token);
      showSuccessMsg('Employee enrolled!');
      setShowEnrollModal(false);
      setEnrollEmployeeId('');
      fetchData();
      if (selectedProgram) {
        const updated = await apiCall('/training', {}, token);
        const prog = updated.find((p: any) => p.id === selectedProgram.id);
        if (prog) setSelectedProgram(prog);
      }
    } catch (err: any) { setError(err.message); }
  };

  const handleUpdateEnrollment = async (id: string, status: string) => {
    try {
      const token = getToken() || '';
      await apiCall(`/training/enrollment/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }, token);
      showSuccessMsg('Enrollment updated!');
      fetchData();
      if (selectedProgram) {
        const updated = await apiCall('/training', {}, token);
        const prog = updated.find((p: any) => p.id === selectedProgram.id);
        if (prog) setSelectedProgram(prog);
      }
    } catch (err) { console.error(err); }
  };

  const handleRemoveEnrollment = async (id: string) => {
    try {
      const token = getToken() || '';
      await apiCall(`/training/enrollment/${id}`, { method: 'DELETE' }, token);
      showSuccessMsg('Enrollment removed!');
      fetchData();
      if (selectedProgram) {
        const updated = await apiCall('/training', {}, token);
        const prog = updated.find((p: any) => p.id === selectedProgram.id);
        if (prog) setSelectedProgram(prog);
      }
    } catch (err) { console.error(err); }
  };

  const filtered = programs.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      {success && <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">✅ {success}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training & Development</h1>
          <p className="text-gray-500 text-sm mt-1">{programs.length} programs</p>
        </div>
        {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'training', 'manage')) && (
          <button onClick={() => { setShowAddModal(true); setError(''); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
            + New Program
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Programs', value: programs.length, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Upcoming', value: programs.filter(p => p.status === 'upcoming').length, bg: 'bg-yellow-50', color: 'text-yellow-600' },
          { label: 'Ongoing', value: programs.filter(p => p.status === 'ongoing').length, bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Completed', value: programs.filter(p => p.status === 'completed').length, bg: 'bg-green-50', color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <input type="text" placeholder="Search programs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
          <p className="text-4xl mb-3">🎓</p>
          <p className="text-gray-500 font-medium">No training programs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(program => (
            <div key={program.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{program.title}</h3>
                  {program.department && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{program.department.name}</span>}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[program.status]}`}>{program.status}</span>
              </div>
              {program.description && <p className="text-sm text-gray-500 mb-3">{program.description}</p>}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                {program.trainerName && <span>👤 {program.trainerName}</span>}
                <span>📅 {new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}</span>
                <span>👥 {program.enrollments.length} enrolled{program.maxParticipants ? ` / ${program.maxParticipants} max` : ''}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedProgram(program); setShowViewModal(true); }}
                  className="flex-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg">
                  View Enrollments
                </button>
                {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'training', 'manage')) && (
                  <>
                    {program.status === 'upcoming' && (
                      <button onClick={() => handleUpdateStatus(program.id, 'ongoing')}
                        className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-3 py-2 rounded-lg">
                        Start
                      </button>
                    )}
                    {program.status === 'ongoing' && (
                      <button onClick={() => handleUpdateStatus(program.id, 'completed')}
                        className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-3 py-2 rounded-lg">
                        Complete
                      </button>
                    )}
                    <button onClick={() => handleDelete(program.id)}
                      className="text-xs bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded-lg">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">New Training Program</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Training title" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Training description..." rows={2}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Name</label>
                <input type="text" value={form.trainerName} onChange={e => setForm({ ...form, trainerName: e.target.value })}
                  placeholder="Trainer name" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                <input type="number" value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: e.target.value })}
                  placeholder="Leave empty for unlimited" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleAdd} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Create Program</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedProgram.title}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'training', 'manage')) && (
              <button onClick={() => { setShowEnrollModal(true); setError(''); setEnrollEmployeeId(''); }}
                className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium">
                + Enroll Employee
              </button>
            )}
            {selectedProgram.enrollments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🎓</p>
                <p className="text-gray-500">No enrollments yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedProgram.enrollments.map(enrollment => (
                  <div key={enrollment.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{enrollment.employee?.user?.name}</p>
                      {enrollment.completedAt && <p className="text-xs text-gray-400">Completed: {new Date(enrollment.completedAt).toLocaleDateString()}</p>}
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{(enrollment.employee as any)?.customRole?.name || "Employee"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={enrollment.status}
                        onChange={e => handleUpdateEnrollment(enrollment.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-semibold border-0 cursor-pointer ${ENROLLMENT_COLORS[enrollment.status]}`}>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                      {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'training', 'manage')) && (
                        <button onClick={() => handleRemoveEnrollment(enrollment.id)}
                          className="text-xs text-red-500 hover:text-red-700">✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowViewModal(false)} className="w-full mt-4 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Close</button>
          </div>
        </div>
      )}

      {showEnrollModal && selectedProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Enroll Employee</h3>
              <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department (filter)</label>
                <select value={enrollDeptFilter} onChange={e => { setEnrollDeptFilter(e.target.value); setEnrollEmployeeId(''); }}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select value={enrollEmployeeId} onChange={e => setEnrollEmployeeId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="">Select employee</option>
                  {employees
                    .filter((emp: any) => !enrollDeptFilter || String(emp.departmentId) === String(enrollDeptFilter))
                    .filter(emp => !selectedProgram.enrollments.some(e => String(e.employee?.id) === String(emp.id)))
                    .map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.user.name} ({emp.employeeCode})</option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEnrollModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleEnroll} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Enroll</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}