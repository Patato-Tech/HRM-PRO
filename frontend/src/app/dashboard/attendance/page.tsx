'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth, canManageEmployees, isCompanyAdmin, isHRManager, isEmployee } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Employee {
  id: string;
  employeeCode: string;
  user: { name: string; email: string };
}

interface Department {
  id: string;
  name: string;
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

interface Shift {
  id: string;
  name: string;
  shiftStart: string;
  shiftEnd: string;
  gracePeriod: number;
  departmentId: string | null;
  department?: { name: string } | null;
  isActive: boolean;
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'shifts'>('today');

  // Check-in/out state
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkedOutToday, setCheckedOutToday] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

  // Edit modal (managers only)
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState({ status: '', checkIn: '', checkOut: '' });

  // Shift settings
  const [shiftForm, setShiftForm] = useState({
    name: 'General Shift',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    gracePeriod: '30',
    departmentId: '',
  });
  const [shiftLoading, setShiftLoading] = useState(false);
  const [shiftError, setShiftError] = useState('');

  const token = getToken() || '';
  const role = user?.role || '';
  const isEmp = isEmployee(role);
  const canManage = canManageEmployees(role);
  const canSetShifts = isCompanyAdmin(role) || isHRManager(role);

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [summaryData, empData, recordsData, deptData] = await Promise.all([
        apiCall('/attendance/summary/today', {}, token),
        apiCall('/employees', {}, token),
        apiCall(`/attendance/date/${selectedDate}`, {}, token),
        apiCall('/departments', {}, token).catch(() => []),
      ]);
      setSummary(summaryData);
      setEmployees(empData || []);
      setRecords(recordsData || []);
      setDepartments(deptData || []);

      // Check today's attendance for current employee
      if (user.employeeId) {
        const today = new Date().toISOString().split('T')[0];
        const todayRecords: AttendanceRecord[] = await apiCall(`/attendance/date/${today}`, {}, token).catch(() => []);
        const myRecord = todayRecords.find((r: AttendanceRecord) => r.employee?.id === user.employeeId || r.employee?.user?.email === user.email);
        if (myRecord) {
          setTodayRecord(myRecord);
          setCheckedInToday(!!myRecord.checkIn);
          setCheckedOutToday(!!myRecord.checkOut);
        } else {
          setTodayRecord(null);
          setCheckedInToday(false);
          setCheckedOutToday(false);
        }
      }

      if (canSetShifts) {
        const shiftData = await apiCall('/attendance/shift', {}, token).catch(() => []);
        setShifts(shiftData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, token, selectedDate, canSetShifts]);

  const fetchByDate = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiCall(`/attendance/date/${selectedDate}`, {}, token);
      setRecords(data || []);
    } catch (err) {
      console.error(err);
    }
  }, [user, token, selectedDate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    if (user) fetchByDate();
  }, [selectedDate, fetchByDate]);

  // ✅ Check-In — moved from Profile page
  const handleCheckIn = async () => {
    if (!user?.employeeId) return;
    setCheckInLoading(true);
    try {
      const res = await apiCall('/attendance/checkin', {
        method: 'POST',
        body: JSON.stringify({ employeeId: user.employeeId }),
      }, token);
      showSuccessMsg(`Checked in! Status: ${res.status}`);
      setCheckedInToday(true);
      setTodayRecord(res);
      fetchData();
    } catch (e: any) {
      setError(e.message || 'Check-in failed');
      setTimeout(() => setError(''), 4000);
    } finally {
      setCheckInLoading(false);
    }
  };

  // ✅ Check-Out — moved from Profile page
  const handleCheckOut = async () => {
    if (!user?.employeeId) return;
    setCheckInLoading(true);
    try {
      const res = await apiCall('/attendance/checkout', {
        method: 'POST',
        body: JSON.stringify({ employeeId: user.employeeId }),
      }, token);
      showSuccessMsg('Checked out successfully!');
      setCheckedOutToday(true);
      setTodayRecord(res);
      fetchData();
    } catch (e: any) {
      setError(e.message || 'Check-out failed');
      setTimeout(() => setError(''), 4000);
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleEdit = async () => {
    setError('');
    if (!selectedRecord) return;
    try {
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

  const handleSaveShift = async () => {
    setShiftError('');
    if (!shiftForm.name.trim() || !shiftForm.shiftStart || !shiftForm.shiftEnd) {
      setShiftError('Name, start time and end time are required');
      return;
    }
    setShiftLoading(true);
    try {
      await apiCall('/attendance/shift', {
        method: 'POST',
        body: JSON.stringify({
          name: shiftForm.name.trim(),
          shiftStart: shiftForm.shiftStart,
          shiftEnd: shiftForm.shiftEnd,
          gracePeriod: parseInt(shiftForm.gracePeriod) || 30,
          departmentId: shiftForm.departmentId || null,
        }),
      }, token);
      showSuccessMsg('Office timings saved!');
      const shiftData = await apiCall('/attendance/shift', {}, token).catch(() => []);
      setShifts(shiftData || []);
    } catch (err: any) {
      setShiftError(err.message || 'Failed to save shift');
    } finally {
      setShiftLoading(false);
    }
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

  const attendancePct = summary?.totalEmployees
    ? Math.round((summary.present / summary.totalEmployees) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {success && (
        <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {error && (
        <div className="fixed top-6 right-6 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          ❌ {error}
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
      </div>

      {/* ✅ CHECK-IN / CHECK-OUT CARD — visible to all users who have employeeId */}
      {user?.employeeId && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Today's Attendance</p>
              <p className="text-2xl font-bold mt-1">{user.name}</p>
              {todayRecord ? (
                <div className="mt-2 space-y-1">
                  <p className="text-blue-100 text-sm">
                    Check-in: <span className="text-white font-semibold">
                      {todayRecord.checkIn
                        ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </span>
                  </p>
                  {todayRecord.checkOut && (
                    <p className="text-blue-100 text-sm">
                      Check-out: <span className="text-white font-semibold">
                        {new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  )}
                  <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold mt-1 ${
                    todayRecord.status === 'present' ? 'bg-green-400 text-green-900'
                    : todayRecord.status === 'late' ? 'bg-yellow-400 text-yellow-900'
                    : 'bg-red-400 text-red-900'
                  }`}>
                    {todayRecord.status}
                  </span>
                </div>
              ) : (
                <p className="text-blue-200 text-sm mt-2">Not checked in yet</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {!checkedInToday ? (
                <button
                  onClick={handleCheckIn}
                  disabled={checkInLoading}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl text-sm disabled:opacity-50 shadow transition-all"
                >
                  {checkInLoading ? 'Recording...' : '⚡ Check In'}
                </button>
              ) : !checkedOutToday ? (
                <button
                  onClick={handleCheckOut}
                  disabled={checkInLoading}
                  className="bg-orange-400 hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-xl text-sm disabled:opacity-50 shadow transition-all"
                >
                  {checkInLoading ? 'Recording...' : '🔴 Check Out'}
                </button>
              ) : (
                <div className="bg-white/20 rounded-xl px-6 py-3 text-center">
                  <p className="text-white font-semibold text-sm">✅ Done for today</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards — managers/admins */}
      {!isEmp && (
        <>
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

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-900">Today's Attendance Rate</p>
              <p className={`text-lg font-bold ${attendancePct >= 80 ? 'text-green-600' : attendancePct >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                {attendancePct}%
              </p>
            </div>
            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className="flex h-full rounded-full overflow-hidden">
                <div className="bg-green-500" style={{ width: `${summary?.totalEmployees ? (summary.present / summary.totalEmployees) * 100 : 0}%` }} />
                <div className="bg-yellow-400" style={{ width: `${summary?.totalEmployees ? (summary.late / summary.totalEmployees) * 100 : 0}%` }} />
                <div className="bg-red-400" style={{ width: `${summary?.totalEmployees ? (summary.absent / summary.totalEmployees) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full inline-block" />Present</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full inline-block" />Late</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full inline-block" />Absent</span>
            </div>
          </div>
        </>
      )}

      {/* Tabs — managers and above only */}
      {!isEmp && (
        <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm flex-wrap">
          {([
            { key: 'today', label: '📅 Today' },
            { key: 'history', label: '📋 By Date' },
            canSetShifts && { key: 'shifts', label: '⚙️ Shift Settings' },
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
      )}

      {/* EMPLOYEE — show their own history only */}
      {isEmp && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Attendance History</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {records.filter(r => r.employee?.user?.email === user?.email).length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">No attendance records yet.</div>
            ) : (
              records
                .filter(r => r.employee?.user?.email === user?.email)
                .slice(0, 30)
                .map(record => (
                  <div key={record.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {record.checkIn ? `In: ${new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No check-in'}
                        {record.checkOut ? ` · Out: ${new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[record.status] || 'bg-gray-100 text-gray-600'}`}>
                      {record.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TODAY TAB */}
      {!isEmp && activeTab === 'today' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" placeholder="Search by name or code..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
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
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No attendance records for today.</td></tr>
                ) : (
                  filtered.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
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

      {/* BY DATE TAB */}
      {!isEmp && activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Date:</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <input type="text" placeholder="Search..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
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
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">No records for {selectedDate}.</td></tr>
                ) : (
                  filtered.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
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

      {/* SHIFT SETTINGS TAB */}
      {!isEmp && activeTab === 'shifts' && canSetShifts && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900">Set Office Timings</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">
              Employees who check in after start + grace period are auto-marked <strong>late</strong>.
            </p>
            {shiftError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{shiftError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name *</label>
                <input type="text" value={shiftForm.name} onChange={e => setShiftForm({ ...shiftForm, name: e.target.value })}
                  placeholder="e.g. General Shift"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input type="time" value={shiftForm.shiftStart} onChange={e => setShiftForm({ ...shiftForm, shiftStart: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input type="time" value={shiftForm.shiftEnd} onChange={e => setShiftForm({ ...shiftForm, shiftEnd: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (minutes)</label>
                  <input type="number" value={shiftForm.gracePeriod} onChange={e => setShiftForm({ ...shiftForm, gracePeriod: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                  <select value={shiftForm.departmentId} onChange={e => setShiftForm({ ...shiftForm, departmentId: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    <option value="">Whole Company</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name} only</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleSaveShift} disabled={shiftLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium">
                {shiftLoading ? 'Saving...' : '💾 Save Office Timings'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Active Shifts</h2>
            </div>
            {shifts.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">No shifts configured yet.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {shifts.map(shift => (
                  <div key={shift.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{shift.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {shift.shiftStart} – {shift.shiftEnd} · {shift.gracePeriod} min grace ·{' '}
                        {shift.departmentId ? (shift.department?.name || 'Department') + ' only' : 'Company-wide'}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${shift.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {shift.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
