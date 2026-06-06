'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface PayrollRecord {
  id: number;
  month: number;
  year: number;
  basic: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
}

interface AttendanceRecord {
  id: number;
  date: string;
  checkIn: string;
  status: 'present' | 'late' | 'absent';
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const ROLE_LABELS: Record<string, string> = {
  COMPANY_ADMIN: 'Company Admin',
  HR_MANAGER:    'HR Manager',
  DEPT_MANAGER:  'Department Manager',
  EMPLOYEE:      'Employee',
};

const ROLE_COLORS: Record<string, string> = {
  COMPANY_ADMIN: 'bg-purple-100 text-purple-700',
  HR_MANAGER:    'bg-blue-100 text-blue-700',
  DEPT_MANAGER:  'bg-yellow-100 text-yellow-700',
  EMPLOYEE:      'bg-green-100 text-green-700',
};

type TabKey = 'info' | 'password' | 'attendance' | 'payroll';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(false);

  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [toast, setToast] = useState('');

  const [editName, setEditName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
    if (user) setEditName(user.name || '');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const token = getToken() || '';

    // ✅ FIXED: uses correct endpoint GET /payroll/employee/:id with token
    if (activeTab === 'payroll' && user.role === 'EMPLOYEE' && user.employeeId) {
      setPayrollLoading(true);
      apiCall(`/payroll/employee/${user.employeeId}`, {}, token)
        .then((data) => setPayrolls(data || []))
        .catch(() => setPayrolls([]))
        .finally(() => setPayrollLoading(false));
    }

    // ✅ FIXED: uses correct endpoint GET /attendance/employee/:id with token
    if (activeTab === 'attendance' && user.employeeId) {
      setAttendanceLoading(true);
      apiCall(`/attendance/employee/${user.employeeId}`, {}, token)
        .then((data) => {
          const logs = data || [];
          setAttendanceLogs(logs);
          // Check if already checked in today
          const today = new Date().toISOString().split('T')[0];
          const todayRecord = logs.find((l: AttendanceRecord) =>
            l.date?.startsWith(today) && l.checkIn
          );
          setCheckedInToday(!!todayRecord);
        })
        .catch(() => setAttendanceLogs([]))
        .finally(() => setAttendanceLoading(false));
    }
  }, [activeTab, user]);

  // ✅ FIXED: correct apiCall signature — apiCall(endpoint, options, token)
  const handleSaveName = async () => {
    setNameError('');
    if (!editName.trim()) { setNameError('Name cannot be empty.'); return; }
    setNameLoading(true);
    try {
      const token = getToken() || '';
      await apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim() }),
      }, token);
      localStorage.setItem('user_name', editName.trim());
      showToast('Profile updated successfully!');
    } catch (e: any) {
      setNameError(e?.message || 'Failed to update profile.');
    } finally {
      setNameLoading(false);
    }
  };

  // ✅ FIXED: correct apiCall signature with token
  const handleChangePassword = async () => {
    setPwError('');
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwError('All fields are required.'); return;
    }
    if (pwForm.newPw.length < 6) {
      setPwError('New password must be at least 6 characters.'); return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('New passwords do not match.'); return;
    }
    setPwLoading(true);
    try {
      const token = getToken() || '';
      await apiCall('/auth/profile/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword: pwForm.newPw,
        }),
      }, token);
      setPwForm({ current: '', newPw: '', confirm: '' });
      showToast('Password changed successfully!');
    } catch (e: any) {
      setPwError(e?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  // ✅ FIXED: correct endpoint /attendance/checkin (no hyphen), correct apiCall signature
  const handleCheckIn = async () => {
    setMarkingAttendance(true);
    try {
      const token = getToken() || '';
      const response = await apiCall('/attendance/checkin', {
        method: 'POST',
        body: JSON.stringify({ employeeId: user?.employeeId }),
      }, token);
      showToast(`Checked in! Status: ${response.status}`);
      setCheckedInToday(true);
      // Refresh logs
      if (user?.employeeId) {
        const logs = await apiCall(`/attendance/employee/${user.employeeId}`, {}, token);
        setAttendanceLogs(logs || []);
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to check in.');
    } finally {
      setMarkingAttendance(false);
    }
  };

  // ✅ FIXED: checkout endpoint
  const handleCheckOut = async () => {
    setMarkingAttendance(true);
    try {
      const token = getToken() || '';
      const response = await apiCall('/attendance/checkout', {
        method: 'POST',
        body: JSON.stringify({ employeeId: user?.employeeId }),
      }, token);
      showToast(`Checked out! Status: ${response.status}`);
      // Refresh logs
      if (user?.employeeId) {
        const logs = await apiCall(`/attendance/employee/${user.employeeId}`, {}, token);
        setAttendanceLogs(logs || []);
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to check out.');
    } finally {
      setMarkingAttendance(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isEmployee = user.role === 'EMPLOYEE';

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'info', label: 'My Info' },
    { key: 'password', label: 'Security' },
    ...(user?.role !== 'COMPANY_ADMIN' ? [{ key: 'attendance' as TabKey, label: 'Attendance' }] : []),
    ...(isEmployee ? [{ key: 'payroll' as TabKey, label: 'Payroll History' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto">

        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5 flex items-center gap-5 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{user.name}</h1>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'}`}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
              {user.companyName && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  🏢 {user.companyName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* MY INFO TAB */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">Personal Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-gray-900 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Email Address</label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed">
                  {user.email}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Designation</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                    {user.designation || 'Not set'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Role</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed">
                    {ROLE_LABELS[user.role] || user.role}
                  </div>
                </div>
              </div>
            </div>

            {nameError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm">{nameError}</div>
            )}

            <button
              onClick={handleSaveName}
              disabled={nameLoading || editName.trim() === user.name}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {nameLoading ? 'Saving...' : 'Update Information'}
            </button>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">Change Password</h2>
            <p className="text-sm text-gray-500">Choose a strong password at least 6 characters long.</p>

            {(['current', 'newPw', 'confirm'] as const).map((field) => {
              const label = field === 'current' ? 'Current Password' : field === 'newPw' ? 'New Password' : 'Confirm New Password';
              return (
                <div key={field}>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
                  <div className="relative">
                    <input
                      type={showPw[field] ? 'text' : 'password'}
                      value={pwForm[field]}
                      onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                      className="w-full text-gray-900 border border-gray-300 rounded-xl px-4 py-3 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder={`Enter ${label.toLowerCase()}`}
                    />
                    <button type="button"
                      onClick={() => setShowPw({ ...showPw, [field]: !showPw[field] })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                      {showPw[field] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              );
            })}

            {pwError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm">{pwError}</div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={pwLoading}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {pwLoading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">My Attendance</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Check-in and check-out are recorded by the server</p>
                </div>
                {/* ✅ Shows Check-In or Check-Out depending on today's state */}
                {user?.role !== 'COMPANY_ADMIN' && (
                <div className="flex gap-2">
                  {!checkedInToday ? (
                    <button
                      onClick={handleCheckIn}
                      disabled={markingAttendance}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl disabled:opacity-50 shadow-sm transition-all"
                    >
                      {markingAttendance ? 'Recording...' : '⚡ Check-In'}
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckOut}
                      disabled={markingAttendance}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl disabled:opacity-50 shadow-sm transition-all"
                    >
                      {markingAttendance ? 'Recording...' : '🔴 Check-Out'}
                    </button>
                  )}
                </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Attendance History</h3>
                {attendanceLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : attendanceLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No attendance records found.</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl px-3">
                    {attendanceLogs.map((log) => (
                      <div key={log.id} className="py-3 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-semibold text-gray-800">{new Date(log.date).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-400">
                            {log.checkIn ? `In: ${new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not checked in'}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          log.status === 'present' ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'late' ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAYROLL HISTORY TAB — Employee only */}
        {activeTab === 'payroll' && isEmployee && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">My Payroll History</h2>
              <p className="text-xs text-gray-400 mt-0.5">Your monthly salary records</p>
            </div>

            {payrollLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : payrolls.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
                <p className="text-sm font-medium">No payroll records yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {payrolls.map((p) => (
                  <div key={p.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {MONTHS[p.month - 1]} {p.year}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Basic: PKR {p.basic.toLocaleString()} &nbsp;·&nbsp;
                        +{p.allowances.toLocaleString()} allowances &nbsp;·&nbsp;
                        -{p.deductions.toLocaleString()} deductions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        PKR {p.netSalary ? p.netSalary.toLocaleString() : (p.basic + p.allowances - p.deductions).toLocaleString()}
                      </p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                        p.status === 'APPROVED' || p.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
