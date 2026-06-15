'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, canManageEmployees, isCompanyAdmin, isHRManager, hasPermission, getRoleName, getRoleColor } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Employee {
  id: string;
  employeeCode: string;
  departmentId: string | null;
  department?: { name: string } | null;
  customRole?: { scope: string; name: string } | null;
  user: { id: string; name: string; email: string };
}

interface Department {
  id: string;
  name: string;
  status: string;
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
    user: { name: string; email: string; role: string };
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
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'bulk' | 'shifts'>('today');

  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const [markForm, setMarkForm] = useState({
    employeeId: '',
    departmentId: '',
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
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [absentLoading, setAbsentLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [myAttendance, setMyAttendance] = useState<any[]>([]);

  // Shift settings form
  const [shiftForm, setShiftForm] = useState({
    name: 'General Shift',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    gracePeriod: '30',
    departmentId: '',   // empty = company-wide
  });
  const [shiftLoading, setShiftLoading] = useState(false);
  const [workingDays, setWorkingDays] = useState<string[]>(['1','2','3','4','5']);
  const [holidays, setHolidays] = useState<{id:string;name:string;startDate:string;endDate:string}[]>([]);
  const [holidayForm, setHolidayForm] = useState({ name: '', startDate: '', endDate: '' });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [shiftError, setShiftError] = useState('');

  const canManage = canManageEmployees(user?.role || '') || hasPermission(user, 'attendance', 'manage');
  const canSetShifts = isCompanyAdmin(user?.role || '');


  // ✅ Page permission guard
  useEffect(() => {
    if (!authLoading && user && user.role !== 'COMPANY_ADMIN' && !(user.role === 'EMPLOYEE' && !user.customRoleName) && !hasPermission(user, 'attendance', 'view')) {
      router.replace('/dashboard');
    }
  }, [user]);
  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    if (user) fetchByDate();
  }, [selectedDate]);

  const fetchData = async () => {
    const token = getToken() || '';
    try {
      const [summaryData, empData, recordsData, deptData] = await Promise.all([
        apiCall('/attendance/summary/today', {}, token),
        apiCall('/employees', {}, token),
        apiCall(`/attendance/date/${selectedDate}`, {}, token),
        apiCall('/departments', {}, token).catch(() => []),
      ]);
      setSummary(summaryData);
      setEmployees(empData);
      setRecords(recordsData);
      setDepartments(deptData || []);
      // Fetch own attendance for custom role users
      if (user?.employeeId) {
        apiCall(`/attendance/employee/${user.employeeId}`, {}, token)
          .then(data => {
            setMyAttendance(data || []);
            const today = new Date().toISOString().split('T')[0];
            const todayRec = (data || []).find((r: any) => r.date?.startsWith(today));
            setTodayRecord(todayRec || null);
          }).catch(() => {});
      }
      // Load shifts only if allowed
      if (isCompanyAdmin(user?.role || '')) {
        // Load working days settings
        apiCall('/attendance/company-settings', {}, token).then(s => {
          if (s?.workingDays) setWorkingDays(s.workingDays.split(','));
        }).catch(() => {});
        // Load holidays
        apiCall('/attendance/company-holidays', {}, token).then(h => {
          setHolidays(h || []);
        }).catch(() => {});
      }
      if (isCompanyAdmin(user?.role || '') || isHRManager(user?.role || '')) {
        const shiftData = await apiCall('/attendance/shift', {}, token).catch(() => []);
        setShifts(shiftData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchByDate = async () => {
    if (!selectedDate) return;
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


  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const token = getToken() || "";
      const result = await apiCall("/attendance/checkin", { method: "POST" }, token);
      setTodayRecord(result);
      showSuccessMsg("Checked in successfully!");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Check-in failed");
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    try {
      const token = getToken() || "";
      await apiCall("/attendance/checkout", { method: "POST" }, token);
      showSuccessMsg("Checked out successfully!");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Check-out failed");
    } finally {
      setCheckOutLoading(false);
    }
  };
  const handleMarkAbsents = async () => {
    setAbsentLoading(true);
    const token = getToken() || '';
    const today = new Date().toISOString().split('T')[0];
    let count = 0;
    try {
      for (const emp of employees) {
        const hasRecord = records.some(r => String(r.employee?.id) === String(emp.id));
        if (!hasRecord) {
          try {
            await apiCall('/attendance/manual', {
              method: 'POST',
              body: JSON.stringify({
                employeeId: emp.id,
                date: today,
                status: 'absent',
              }),
            }, token);
            count++;
          } catch { /* skip */ }
        }
      }
      showSuccessMsg(`${count} employees marked absent`);
      fetchData();
    } finally {
      setAbsentLoading(false);
    }
  };

  const handleMarkSingle = async () => {
    setError('');
    if (!markForm.employeeId) { setError('Please select an employee'); return; }
    try {
      const token = getToken() || '';
      await apiCall('/attendance/manual', {
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
        await apiCall('/attendance/manual', {
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

  // ✅ NEW: save office timings / shift schedule
  const handleSaveShift = async () => {
    setShiftError('');
    if (!shiftForm.name.trim()) { setShiftError('Shift name is required'); return; }
    if (!shiftForm.shiftStart || !shiftForm.shiftEnd) { setShiftError('Start and end time are required'); return; }
    setShiftLoading(true);
    try {
      const token = getToken() || '';
      await apiCall('/attendance/shift', {
        method: 'POST',
        body: JSON.stringify({
          name: shiftForm.name.trim(),
          shiftStart: shiftForm.shiftStart,           // "HH:MM"
          shiftEnd: shiftForm.shiftEnd,               // "HH:MM"
          gracePeriod: parseInt(shiftForm.gracePeriod) || 30,
          departmentId: shiftForm.departmentId || null, // null = company-wide
        }),
      }, token);
      showSuccessMsg('Office timings saved! Check-ins will now follow this shift.');
      // refresh shift list
      const shiftData = await apiCall('/attendance/shift', {}, token).catch(() => []);
      setShifts(shiftData || []);
    } catch (err: any) {
      setShiftError(err.message || 'Failed to save shift');
    } finally {
      setShiftLoading(false);
    }
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
    const matchDept = deptFilter === 'all' || (r.employee as any)?.department?.name === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const handleSaveWorkingDays = async () => {
    setSettingsLoading(true);
    try {
      const token = getToken();
      await apiCall('/attendance/company-settings', { method: 'PUT', body: JSON.stringify({ workingDays: workingDays.join(',') }) }, token || '');
      showSuccessMsg('Working days saved successfully!');
    } catch (err: any) {
      showSuccessMsg('Error: ' + (err.message || 'Failed to save'));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayForm.name || !holidayForm.startDate || !holidayForm.endDate) return;
    try {
      const token = getToken();
      const h = await apiCall('/attendance/company-holidays', { method: 'POST', body: JSON.stringify(holidayForm) }, token || '');
      setHolidays(prev => [...prev, h]);
      setHolidayForm({ name: '', startDate: '', endDate: '' });
      showSuccessMsg('Holiday added!');
    } catch (err: any) {
      showSuccessMsg('Error: ' + (err.message || 'Failed to add holiday'));
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      const token = getToken();
      await apiCall(`/attendance/company-holidays/${id}`, { method: 'DELETE' }, token || '');
      setHolidays(prev => prev.filter(h => h.id !== id));
      showSuccessMsg('Holiday deleted!');
    } catch (err: any) {
      console.error(err);
    }
  };

  const DAYS = [
    { value: '0', label: 'Sun' },
    { value: '1', label: 'Mon' },
    { value: '2', label: 'Tue' },
    { value: '3', label: 'Wed' },
    { value: '4', label: 'Thu' },
    { value: '5', label: 'Fri' },
    { value: '6', label: 'Sat' },
  ];

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
        <div className="flex gap-2">
          <button onClick={handleMarkAbsents} disabled={absentLoading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
            {absentLoading ? "Marking..." : "Mark Absents"}
          </button>
          <button onClick={() => { setShowMarkModal(true); setError(""); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
            + Mark Attendance
          </button>
        </div>
        )}

      </div>

      {/* Today Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Present', value: summary?.present ?? 0, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
          { label: 'Absent', value: summary?.absent ?? 0, color: 'text-red-500', bg: 'bg-red-50', icon: '❌' },
          { label: 'Late', value: summary?.late ?? 0, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏰' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
        <div className="bg-blue-50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium">Total Employees</p>
            <span className="text-xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{summary?.totalEmployees ?? 0}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {employees.map((emp: any) => (
              <span key={emp.id} className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${emp.customRole ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {emp.customRole?.name || 'Employee'}
              </span>
            ))}
          </div>
        </div>
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
      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm flex-wrap">
        {([
          { key: 'today', label: '📅 Today' },
          { key: 'history', label: '📋 By Date' },
          canManage && { key: 'bulk', label: '📝 Bulk Mark' },
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

      {/* TODAY TAB */}
      {(user?.role === "EMPLOYEE" || user?.customRoleName) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">My Attendance</h2>
              <p className="text-xs text-gray-400 mt-0.5">Your personal attendance summary</p>
            </div>
            <div className="flex gap-2">
              {!todayRecord?.checkIn ? (
                <button onClick={handleCheckIn} disabled={checkInLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium">
                  {checkInLoading ? "Checking in..." : "✅ Check In"}
                </button>
              ) : !todayRecord?.checkOut ? (
                <button onClick={handleCheckOut} disabled={checkOutLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium">
                  {checkOutLoading ? "Checking out..." : "🚪 Check Out"}
                </button>
              ) : (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded-xl font-medium">✅ Done for today</span>
              )}
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-600 px-5 py-3 text-sm">{error}</div>}
          <div className="p-5">
            {(() => {
              const presentDays = myAttendance.filter((r: any) => r.status === "present").length;
              const lateDays = myAttendance.filter((r: any) => r.status === "late").length;
              const absentDays = myAttendance.filter((r: any) => r.status === "absent").length;
              const totalDays = myAttendance.length;
              const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;
              return (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Present", value: presentDays, color: "text-green-600", bg: "bg-green-50" },
                      { label: "Late", value: lateDays, color: "text-yellow-600", bg: "bg-yellow-50" },
                      { label: "Absent", value: absentDays, color: "text-red-500", bg: "bg-red-50" },
                    ].map((s, i) => (
                      <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">My Attendance Rate</span>
                      <span className="text-xs font-bold text-blue-600">{attendanceRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${attendanceRate}%` }}></div>
                    </div>
                  </div>
                  {todayRecord && (
                    <div className="bg-blue-50 rounded-xl p-3 mb-4">
                      <p className="text-xs font-semibold text-blue-700 mb-1">Today</p>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>In: {todayRecord.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}) : "—"}</span>
                        <span>Out: {todayRecord.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}) : "—"}</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${todayRecord.status === "present" ? "bg-green-100 text-green-700" : todayRecord.status === "late" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>{todayRecord.status}</span>
                      </div>
                    </div>
                  )}
                  {myAttendance.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent History</p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {myAttendance.slice(0, 10).map((rec: any) => (
                          <div key={rec.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{new Date(rec.date).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-400">
                                In: {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}) : "—"}
                                {" "}Out: {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}) : "—"}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${rec.status === "present" ? "bg-green-100 text-green-700" : rec.status === "late" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                              {rec.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
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
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="all">All Departments</option>
                  {departments.filter(d => d.status === "active").map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Code', 'Department', 'Status', 'Check In', 'Check Out'].map(h => (
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
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-gray-900 text-sm">{record.employee?.user?.name}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${getRoleColor(record.employee?.user?.role || '', (record.employee as any)?.customRole)}`}>
                                {getRoleName(record.employee?.user?.role || '', (record.employee as any)?.customRole).slice(0,8)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">{record.employee?.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{record.employee?.employeeCode}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{(record.employee as any)?.department?.name ? (<span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{(record.employee as any)?.department?.name}</span>) : (record.employee as any)?.customRole?.scope === "all" ? (<span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Company Wide</span>) : (<span className="text-xs text-gray-400">—</span>)}</td>
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
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="all">All Departments</option>
                  {departments.filter(d => d.status === "active").map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Code', 'Department', 'Date', 'Status', 'Check In', 'Check Out', canManage && 'Actions'].filter(Boolean).map(h => (
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
                      <td className="px-6 py-4 text-sm text-gray-600">{(record.employee as any)?.department?.name ? (<span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{(record.employee as any)?.department?.name}</span>) : (record.employee as any)?.customRole?.scope === "all" ? (<span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Company Wide</span>) : (<span className="text-xs text-gray-400">—</span>)}</td>
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

      {activeTab === "bulk" && canManage && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Bulk Mark Attendance</h2>
                <p className="text-xs text-gray-400 mt-1">Mark attendance for all employees at once</p>
              </div>
              <div className="flex items-center gap-3">
                <input type="date" value={bulkDate} onChange={e => { setBulkDate(e.target.value); initBulkForms(); }}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                <button onClick={initBulkForms}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium">
                  Load Employees
                </button>
                <button onClick={handleBulkMark} disabled={bulkLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium">
                  {bulkLoading ? "Saving..." : "Save All"}
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Employee", "Code", "Department", "Status", "Check In", "Check Out"].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Click "Load Employees" to start</td></tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 text-blue-700 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs">
                            {emp.user.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-semibold text-gray-900 text-sm">{emp.user.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-gray-600">{emp.employeeCode}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{emp.department?.name ? (<span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{emp.department.name}</span>) : emp.customRole?.scope === "all" ? (<span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Company Wide</span>) : (<span className="text-xs text-gray-400">—</span>)}</td>
                      <td className="px-6 py-3">
                        <select value={bulkForms[emp.id]?.status || "present"}
                          onChange={e => setBulkForms(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], status: e.target.value } }))}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                          <option value="half_day">Half Day</option>
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <input type="time" value={bulkForms[emp.id]?.checkIn || ""}
                          onChange={e => setBulkForms(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], checkIn: e.target.value } }))}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-6 py-3">
                        <input type="time" value={bulkForms[emp.id]?.checkOut || ""}
                          onChange={e => setBulkForms(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], checkOut: e.target.value } }))}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'shifts' && canSetShifts && (
        <div className="space-y-5">
          {/* Set Office Timings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900">Set Office Timings</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">
              Once set, employees who check in late (after start + grace) are auto-marked <b>late</b>; on-time check-ins are marked <b>present</b>.
            </p>

            {shiftError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{shiftError}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name *</label>
                <input
                  type="text"
                  value={shiftForm.name}
                  onChange={e => setShiftForm({ ...shiftForm, name: e.target.value })}
                  placeholder="e.g. General Shift"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={shiftForm.shiftStart}
                    onChange={e => setShiftForm({ ...shiftForm, shiftStart: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={shiftForm.shiftEnd}
                    onChange={e => setShiftForm({ ...shiftForm, shiftEnd: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (minutes)</label>
                  <input
                    type="number"
                    value={shiftForm.gracePeriod}
                    onChange={e => setShiftForm({ ...shiftForm, gracePeriod: e.target.value })}
                    placeholder="30"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-400 mt-1">Late only after start + this many minutes</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                  <select
                    value={shiftForm.departmentId}
                    onChange={e => setShiftForm({ ...shiftForm, departmentId: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Whole Company (default)</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name} only</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Department shift overrides company default</p>
                </div>
              </div>

              <button
                onClick={handleSaveShift}
                disabled={shiftLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition-colors mt-2"
              >
                {shiftLoading ? 'Saving...' : '💾 Save Office Timings'}
              </button>
            </div>
          </div>

          {/* Existing Shifts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Active Shifts</h2>
            </div>
            {shifts.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                No shifts configured yet. Set one above to start tracking late arrivals.
              </div>
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
          {/* Working Days */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Working Days</h2>
            <p className="text-xs text-gray-400 mb-4">Select which days employees are expected to work</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {DAYS.map(day => (
                <button key={day.value} onClick={() => {
                  setWorkingDays(prev =>
                    prev.includes(day.value) ? prev.filter(d => d !== day.value) : [...prev, day.value]
                  );
                }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    workingDays.includes(day.value)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}>
                  {day.label}
                </button>
              ))}
            </div>
            <button onClick={handleSaveWorkingDays} disabled={settingsLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
              {settingsLoading ? 'Saving...' : '💾 Save Working Days'}
            </button>
          </div>

          {/* Public Holidays */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Public Holidays</h2>
            <p className="text-xs text-gray-400 mb-4">No attendance required on these days</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
              <input type="text" value={holidayForm.name} onChange={e => setHolidayForm({...holidayForm, name: e.target.value})}
                placeholder="Holiday name (e.g. Eid ul Fitr)"
                className="sm:col-span-2 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              <div className="flex items-center gap-1">
                <input type="date" value={holidayForm.startDate} onChange={e => setHolidayForm({...holidayForm, startDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div className="flex items-center gap-1">
                <input type="date" value={holidayForm.endDate} onChange={e => setHolidayForm({...holidayForm, endDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
            </div>
            <button onClick={handleAddHoliday}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium mb-4">
              + Add Holiday
            </button>
            {holidays.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No public holidays added yet</p>
            ) : (
              <div className="space-y-2">
                {holidays.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{h.name}</p>
                      <p className="text-xs text-gray-400">{new Date(h.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{h.endDate && h.endDate !== h.startDate ? ` → ${new Date(h.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}</p>
                    </div>
                    <button onClick={() => handleDeleteHoliday(h.id)}
                      className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded-lg hover:bg-red-50">
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MARK SINGLE MODAL */}

      {showMarkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mark Attendance</h3>
              <button onClick={() => setShowMarkModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              {(() => {
                const selectedEmp = employees.find(e => String(e.id) === String(markForm.employeeId));
                const isCompanyWide = selectedEmp && (selectedEmp?.customRole?.scope === "all" || (!selectedEmp?.customRole && !selectedEmp?.departmentId));
                return !isCompanyWide && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-gray-400 font-normal">(optional filter)</span></label>
                    <select value={markForm.departmentId} onChange={e => setMarkForm({ ...markForm, departmentId: e.target.value, employeeId: "" })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                      <option value="">All Departments</option>
                      {departments.filter(d => d.status === "active").map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                );
              })()}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select value={markForm.employeeId} onChange={e => setMarkForm({ ...markForm, employeeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="">Select employee</option>
                  {employees.filter(emp => !markForm.departmentId || String(emp.departmentId) === String(markForm.departmentId)).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.user.name} ({emp.employeeCode}){emp.customRole ? ` [${emp.customRole.name}]` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" value={markForm.date} onChange={e => setMarkForm({ ...markForm, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select value={markForm.status} onChange={e => setMarkForm({ ...markForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                </select>
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
              <button onClick={() => setShowMarkModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleMarkSingle} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Mark Attendance</button>
            </div>
          </div>
        </div>
      )}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Attendance</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="bg-blue-50 rounded-xl p-3 mb-4">
              <p className="font-semibold text-gray-900 text-sm">{selectedRecord.employee?.user?.name}</p>
              <p className="text-xs text-gray-500">{new Date(selectedRecord.date).toLocaleDateString()}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check In Time</label>
                  <input type="time" value={editForm.checkIn} onChange={e => setEditForm({ ...editForm, checkIn: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Out Time</label>
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