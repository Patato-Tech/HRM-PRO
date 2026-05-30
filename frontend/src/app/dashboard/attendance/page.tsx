'use client';

import { useEffect, useState } from 'react';
import { useAuth, canManageEmployees } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Employee {
  id: string;
  employeeCode: string;
  user: { name: string; email: string };
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  employee: {
    id: string;
    employeeCode: string;
    user: { name: string; email: string };
  };
}

interface TodaySummary {
  present: number;
  absent: number;
  late: number;
  totalEmployees: number;
}

const STATUS_OPTIONS = ['present', 'absent', 'late', 'half_day'];

const statusColors: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  half_day: 'bg-blue-100 text-blue-700',
};

export default function AttendancePage() {
  const { user } = useAuth(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'mark'>('today');

  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const [markForm, setMarkForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '',
    checkOut: '',
  });

  const [editForm, setEditForm] = useState({
    status: '',
    checkIn: '',
    checkOut: '',
  });

  const [bulkForms, setBulkForms] = useState<Record<string, { status: string; checkIn: string; checkOut: string }>>({});
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const canManage = canManageEmployees(user?.role || '');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    if (user) fetchByDate();
  }, [selectedDate]);

  const fetchData = async () => {
    const token = getToken() || '';
    try {
      const [summaryData, empData, recordsData] = await Promise.all([
        apiCall('/attendance/summary/today', {}, token),
        apiCall('/employees', {}, token),
        apiCall(`/attendance/date/${selectedDate}`, {}, token),
      ]);
      setSummary(summaryData);
      setEmployees(empData);
      setRecords(recordsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchByDate = async () => {
    const token = getToken() || '';
    try {
      const data = await apiCall(`/attendance/date/${selectedDate}`, {}, token);
      setRecords(data);
    } catch (err) {
      console.error(err);
    }
  };

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleMarkSingle = async () => {
    setError('');
    if (!markForm.employeeId) { setError('Please select an employee'); return; }
    try {
      const token = getToken() || '';
      await apiCall('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: markForm.employeeId,
          date: markForm.date,
          status: markForm.status,
          checkIn: markForm.checkIn ? new Date(`${markForm.date}T${markForm.checkIn}`).toISOString() : undefined,
          checkOut: markForm.checkOut ? new Date(`${markForm.date}T${markForm.checkOut}`).toISOString() : undefined,
        }),
      }, token);
      setShowMarkModal(false);
      setMarkForm({ employeeId: '', date: new Date().toISOString().split('T')[0], status: 'present', checkIn: '', checkOut: '' });
      showSuccessMsg('Attendance marked successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = async () => {
    setError('');
    if (!selectedRecord) return;
    try {
      const token = getToken() || '';
      await apiCall(`/attendance/${selectedRecord.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: editForm.status,
          checkIn: editForm.checkIn ? new Date(`${selectedDate}T${editForm.checkIn}`).toISOString() : undefined,
          checkOut: editForm.checkOut ? new Date(`${selectedDate}T${editForm.checkOut}`).toISOString() : undefined,
        }),
      }, token);
      setShowEditModal(false);
      showSuccessMsg('Attendance updated!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulkMark = async () => {
    setError('');
    setBulkLoading(true);
    const token = getToken() || '';
    let successCount = 0;
    let errorCount = 0;

    for (const [employeeId, form] of Object.entries(bulkForms)) {
      if (!form.status) continue;
      try {
        await apiCall('/attendance', {
          method: 'POST',
          body: JSON.stringify({
            employeeId,
            date: bulkDate,
            status: form.status,
            checkIn: form.checkIn ? new Date(`${bulkDate}T${form.checkIn}`).toISOString() : undefined,
            checkOut: form.checkOut ? new Date(`${bulkDate}T${form.checkOut}`).toISOString() : undefined,
          }),
        }, token);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setBulkLoading(false);
    setBulkForms({});
    showSuccessMsg(`Marked ${successCount} employees. ${errorCount > 0 ? `${errorCount} failed.` : ''}`);
    fetchData();
  };

  const initBulkForms = () => {
    const forms: Record<string, { status: string; checkIn: string; checkOut: string }> = {};
    employees.forEach(emp => {
      forms[emp.id] = { status: 'present', checkIn: '09:00', checkOut: '17:00' };
    });
    setBulkForms(forms);
  };

  const openEditModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditForm({
      status: record.status,
      checkIn: record.checkIn ? new Date(record.checkIn).toTimeString().slice(0, 5) : '',
      checkOut: record.checkOut ? new Date(record.checkOut).toTimeString().slice(0, 5) : '',
    });
    setShowEditModal(true);
    setError('');
  };

  const filtered = records.filter(r => {
    const matchSearch = r.employee?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employee?.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const attendancePct = summary?.totalEmployees
    ? Math.round((summary.present / summary.totalEmployees) * 100)
    : 0;

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
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowMarkModal(true); setError(''); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            + Mark Attendance
          </button>
        )}
      </div>

      {/* Today Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Present', value: summary?.present ?? 0, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
          { label: 'Absent', value: summary?.absent ?? 0, color: 'text-red-500', bg: 'bg-red-50', icon: '❌' },
          { label: 'Late', value: summary?.late ?? 0, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏰' },
          { label: 'Total Employees', value: summary?.totalEmployees ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', icon: '👥' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Attendance Rate Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-900">Today's Attendance Rate</p>
          <p className={`text-lg font-bold ${attendancePct >= 80 ? 'text-green-600' : attendancePct >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
            {attendancePct}%
          </p>
        </div>
        <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
          <div className="flex h-full rounded-full overflow-hidden">
            <div className="bg-green-500 transition-all" style={{ width: `${summary?.totalEmployees ? (summary.present / summary.totalEmployees) * 100 : 0}%` }} />
            <div className="bg-yellow-400 transition-all" style={{ width: `${summary?.totalEmployees ? (summary.late / summary.totalEmployees) * 100 : 0}%` }} />
            <div className="bg-red-400 transition-all" style={{ width: `${summary?.totalEmployees ? (summary.absent / summary.totalEmployees) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>Present</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>Late</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full inline-block"></span>Absent</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm">
        {([
          { key: 'today', label: '📅 Today' },
          { key: 'history', label: '📋 By Date' },
          canManage && { key: 'mark', label: '✏️ Bulk Mark' },
        ] as any[]).filter(Boolean).map((tab: any) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {activeTab === 'today' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by name or code..."
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
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Code', 'Status', 'Check In', 'Check Out', canManage && 'Actions'].filter(Boolean).map(h => (
                    <th key={h as string} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <p className="text-3xl mb-3">📅</p>
                      <p className="text-gray-500 font-medium">No attendance records for today</p>
                      {canManage && (
                        <button onClick={() => setShowMarkModal(true)} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm">
                          Mark Now
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                            {record.employee?.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{record.employee?.user?.name}</p>
                            <p className="text-xs text-gray-400">{record.employee?.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{record.employee?.employeeCode}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[record.status] || 'bg-gray-100 text-gray-600'}`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openEditModal(record)}
                            className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BY DATE TAB */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <input
                type="text"
                placeholder="Search by name or code..."
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
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Code', 'Date', 'Status', 'Check In', 'Check Out', canManage && 'Actions'].filter(Boolean).map(h => (
                    <th key={h as string} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <p className="text-3xl mb-3">📋</p>
                      <p className="text-gray-500 font-medium">No records for {selectedDate}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                            {record.employee?.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-semibold text-gray-900 text-sm">{record.employee?.user?.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{record.employee?.employeeCode}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[record.status] || 'bg-gray-100 text-gray-600'}`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4">
                          <button onClick={() => openEditModal(record)}
                            className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg">
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BULK MARK TAB */}
      {activeTab === 'mark' && canManage && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-gray-900">Bulk Mark Attendance</h2>
                <p className="text-xs text-gray-400 mt-0.5">Mark attendance for all employees at once</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={bulkDate}
                  onChange={e => setBulkDate(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <button
                  onClick={initBulkForms}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium"
                >
                  Load Employees
                </button>
              </div>
            </div>
          </div>

          {Object.keys(bulkForms).length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-3xl mb-3">✏️</p>
              <p className="text-gray-500 font-medium">Click "Load Employees" to start bulk marking</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Employee', 'Status', 'Check In', 'Check Out'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                              {emp.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{emp.user.name}</p>
                              <p className="text-xs text-gray-400">{emp.employeeCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <select
                            value={bulkForms[emp.id]?.status || 'present'}
                            onChange={e => setBulkForms(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], status: e.target.value } }))}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="time"
                            value={bulkForms[emp.id]?.checkIn || ''}
                            onChange={e => setBulkForms(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], checkIn: e.target.value } }))}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="time"
                            value={bulkForms[emp.id]?.checkOut || ''}
                            onChange={e => setBulkForms(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], checkOut: e.target.value } }))}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-5 border-t border-gray-100">
                <button
                  onClick={handleBulkMark}
                  disabled={bulkLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  {bulkLoading ? 'Marking...' : `✅ Submit Attendance for ${Object.keys(bulkForms).length} Employees`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* MARK SINGLE MODAL */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mark Attendance</h3>
              <button onClick={() => { setShowMarkModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select value={markForm.employeeId} onChange={e => setMarkForm({ ...markForm, employeeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="">Select employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.user.name} ({emp.employeeCode})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={markForm.date} onChange={e => setMarkForm({ ...markForm, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select value={markForm.status} onChange={e => setMarkForm({ ...markForm, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                  <input type="time" value={markForm.checkIn} onChange={e => setMarkForm({ ...markForm, checkIn: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                  <input type="time" value={markForm.checkOut} onChange={e => setMarkForm({ ...markForm, checkOut: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowMarkModal(false); setError(''); }} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleMarkSingle} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Mark Attendance</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Attendance</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}

            <div className="bg-blue-50 rounded-xl p-3 mb-4">
              <p className="font-semibold text-gray-900 text-sm">{selectedRecord.employee?.user?.name}</p>
              <p className="text-xs text-gray-500">{new Date(selectedRecord.date).toLocaleDateString()}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                  <input type="time" value={editForm.checkIn} onChange={e => setEditForm({ ...editForm, checkIn: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                  <input type="time" value={editForm.checkOut} onChange={e => setEditForm({ ...editForm, checkOut: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
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
    </div>
  );
}
