'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, canManagePayroll, isEmployee, hasPermission } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  totalEmployees: number;
}

interface LeaveRecord {
  id: string;
  leaveType: string;
  status: string;
  days: number;
  employee: { user: { name: string } };
}

interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
}

interface PayrollSummary {
  totalRecords: number;
  totalPaid: number;
  totalPending: number;
  pendingCount: number;
}

interface Department {
  id: string;
  name: string;
  _count?: { employees: number };
}

interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  employee?: { employeeCode: string; user: { name: string } };
}

type ReportTab = 'attendance' | 'leaves' | 'payroll' | 'headcount';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const statusColors: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
  PAID: 'bg-blue-100 text-blue-700',
};

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();

  // ✅ Page permission guard
  useEffect(() => {
    if (!authLoading && user && user.role !== 'COMPANY_ADMIN' && !hasPermission(user, 'reports', 'view')) {
      router.replace('/dashboard');
    }
  }, [user]);
  const [activeTab, setActiveTab] = useState<ReportTab>('attendance');
  const [loading, setLoading] = useState(false);

  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [leaveFilter, setLeaveFilter] = useState('all');

  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);

  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [myLeaveBalances, setMyLeaveBalances] = useState<LeaveBalance[]>([]);

  const token = getToken() || '';
  const role = user?.role || '';
  const isEmp = isEmployee(role) && !user?.customRoleName && !hasPermission(user, 'reports', 'view');
  const isDeptMgr = user?.customRoleScope === 'own_department' && hasPermission(user, 'reports', 'view');

  // ✅ useCallback so these are stable references for useEffect deps
  const fetchEmployeeData = useCallback(async () => {
    if (!user?.employeeId) return;
    setLoading(true);
    try {
      const [att, bal] = await Promise.all([
        apiCall(`/attendance/employee/${user.employeeId}`, {}, token),
        apiCall(`/leaves/balance/${user.employeeId}`, {}, token),
      ]);
      setMyAttendance(att || []);
      setMyLeaveBalances(bal || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.employeeId, token]);

  const fetchTabData = useCallback(async (tab: ReportTab) => {
    setLoading(true);
    try {
      if (tab === 'attendance') {
        const [summary, records] = await Promise.all([
          apiCall('/attendance/summary/today', {}, token),
          apiCall(`/attendance/date/${attendanceDate}`, {}, token),
        ]);
        setAttendanceSummary(summary);
        setAttendanceRecords(records || []);
      } else if (tab === 'leaves') {
        const leaves = await apiCall('/leaves', {}, token);
        setLeaveRecords(leaves || []);
      } else if (tab === 'payroll') {
        const [summary, monthly] = await Promise.all([
          apiCall('/payroll/summary', {}, token),
          apiCall(`/payroll/month?month=${payrollMonth}&year=${payrollYear}`, {}, token),
        ]);
        setPayrollSummary(summary);
        setPayrollRecords(monthly || []);
      } else if (tab === 'headcount') {
        const [stats, depts] = await Promise.all([
          apiCall('/employees/stats', {}, token),
          apiCall('/departments', {}, token),
        ]);
        setEmployeeStats(stats);
        setDepartments(depts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, attendanceDate, payrollMonth, payrollYear]);

  // ✅ All deps now satisfied — no warnings
  useEffect(() => {
    if (authLoading || !user) return;
    if (isEmp) {
      fetchEmployeeData();
    } else {
      fetchTabData(activeTab);
    }
  }, [user, isEmp, activeTab, fetchEmployeeData, fetchTabData]);

  const filteredLeaves = leaveRecords.filter(l =>
    leaveFilter === 'all' || l.status === leaveFilter
  );

  const attendancePct = attendanceSummary?.totalEmployees
    ? Math.round((attendanceSummary.present / attendanceSummary.totalEmployees) * 100)
    : 0;

  // ── EMPLOYEE VIEW ────────────────────────────────────────────────────────────
  if (isEmp) {
    const presentDays = myAttendance.filter(a => a.status === 'present').length;
    const lateDays = myAttendance.filter(a => a.status === 'late').length;
    const absentDays = myAttendance.filter(a => a.status === 'absent').length;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Your personal attendance and leave summary</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-3">Attendance Overview</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Present', value: presentDays, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
                  { label: 'Late', value: lateDays, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏰' },
                  { label: 'Absent', value: absentDays, color: 'text-red-500', bg: 'bg-red-50', icon: '❌' },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} rounded-2xl p-5`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                      <span className="text-xl">{s.icon}</span>
                    </div>
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">days</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Recent Attendance</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {myAttendance.slice(0, 10).length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">No attendance records found.</div>
                ) : (
                  myAttendance.slice(0, 10).map(record => (
                    <div key={record.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {record.checkIn ? `Check-in: ${new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No check-in'}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[record.status] || 'bg-gray-100 text-gray-600'}`}>
                        {record.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Leave Balances</h2>
              </div>
              {myLeaveBalances.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">No leave balances configured.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {myLeaveBalances.map((bal, i) => {
                    const usedPct = bal.total > 0 ? Math.round((bal.used / bal.total) * 100) : 0;
                    return (
                      <div key={i} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-900">{bal.leaveType.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-500">{bal.used} / {bal.total} used</p>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${usedPct > 80 ? 'bg-red-500' : usedPct > 50 ? 'bg-yellow-400' : 'bg-green-500'}`}
                            style={{ width: `${usedPct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{bal.remaining} days remaining</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── MANAGER / ADMIN VIEW ─────────────────────────────────────────────────────
  const tabs = [
    { key: 'attendance' as ReportTab, label: '📅 Attendance' },
    { key: 'leaves' as ReportTab, label: '🌿 Leaves' },
    ...(!isDeptMgr ? [{ key: 'payroll' as ReportTab, label: '💰 Payroll' }] : []),
    { key: 'headcount' as ReportTab, label: '👥 Headcount' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isDeptMgr ? 'Department-level reports' : 'Company-wide analytics and summaries'}
        </p>
      </div>

      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm">
        {tabs.map(tab => (
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

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* ── ATTENDANCE TAB ── */}
          {activeTab === 'attendance' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Present', value: attendanceSummary?.present ?? 0, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
                  { label: 'Absent', value: attendanceSummary?.absent ?? 0, color: 'text-red-500', bg: 'bg-red-50', icon: '❌' },
                  { label: 'Late', value: attendanceSummary?.late ?? 0, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏰' },
                  { label: 'Total', value: attendanceSummary?.totalEmployees ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', icon: '👥' },
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
                    <div className="bg-green-500" style={{ width: `${attendanceSummary?.totalEmployees ? (attendanceSummary.present / attendanceSummary.totalEmployees) * 100 : 0}%` }} />
                    <div className="bg-yellow-400" style={{ width: `${attendanceSummary?.totalEmployees ? (attendanceSummary.late / attendanceSummary.totalEmployees) * 100 : 0}%` }} />
                    <div className="bg-red-400" style={{ width: `${attendanceSummary?.totalEmployees ? (attendanceSummary.absent / attendanceSummary.totalEmployees) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full inline-block" />Present</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full inline-block" />Late</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full inline-block" />Absent</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">View by date:</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <span className="text-sm text-gray-400">{attendanceRecords.length} records</span>
                </div>
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
                      {attendanceRecords.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">No records for this date.</td></tr>
                      ) : (
                        attendanceRecords.map(r => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                                  {r.employee?.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">{r.employee?.user?.name}</p>
                                  <p className="text-xs text-gray-400">{r.employee?.employeeCode}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[r.status] || 'bg-gray-100 text-gray-600'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── LEAVES TAB ── */}
          {activeTab === 'leaves' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total', value: leaveRecords.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Pending', value: leaveRecords.filter(l => l.status === 'PENDING').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { label: 'Approved', value: leaveRecords.filter(l => l.status === 'APPROVED').length, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Rejected', value: leaveRecords.filter(l => l.status === 'REJECTED').length, color: 'text-red-500', bg: 'bg-red-50' },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} rounded-2xl p-5`}>
                    <p className="text-xs text-gray-500 font-medium mb-2">{s.label}</p>
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                  <p className="font-semibold text-gray-900 flex-1">Leave Records</p>
                  <select
                    value={leaveFilter}
                    onChange={e => setLeaveFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Employee', 'Type', 'Days', 'Status'].map(h => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredLeaves.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">No leave records found.</td></tr>
                      ) : (
                        filteredLeaves.map(leave => (
                          <tr key={leave.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-green-100 text-green-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                                  {leave.employee?.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <p className="font-semibold text-gray-900 text-sm">{leave.employee?.user?.name}</p>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">{leave.leaveType.replace('_', ' ')}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{leave.days} days</td>
                            <td className="px-6 py-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[leave.status] || 'bg-gray-100 text-gray-600'}`}>
                                {leave.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── PAYROLL TAB ── */}
          {activeTab === 'payroll' && !isDeptMgr && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Records', value: payrollSummary?.totalRecords ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', format: false },
                  { label: 'Total Paid', value: payrollSummary?.totalPaid ?? 0, color: 'text-green-600', bg: 'bg-green-50', format: true },
                  { label: 'Pending Amount', value: payrollSummary?.totalPending ?? 0, color: 'text-yellow-600', bg: 'bg-yellow-50', format: true },
                  { label: 'Pending Count', value: payrollSummary?.pendingCount ?? 0, color: 'text-red-500', bg: 'bg-red-50', format: false },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} rounded-2xl p-5`}>
                    <p className="text-xs text-gray-500 font-medium mb-2">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>
                      {s.format ? `PKR ${Number(s.value).toLocaleString()}` : s.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-gray-900 flex-1">Monthly Payroll</p>
                  <select
                    value={payrollMonth}
                    onChange={e => setPayrollMonth(Number(e.target.value))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <select
                    value={payrollYear}
                    onChange={e => setPayrollYear(Number(e.target.value))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Employee', 'Basic', 'Allowances', 'Deductions', 'Net Salary', 'Status'].map(h => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {payrollRecords.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No payroll records for this month.</td></tr>
                      ) : (
                        payrollRecords.map((p: any) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-purple-100 text-purple-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                                  {p.employee?.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <p className="font-semibold text-gray-900 text-sm">{p.employee?.user?.name}</p>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">PKR {Number(p.basic).toLocaleString()}</td>
                            <td className="px-6 py-3 text-sm text-green-600">+{Number(p.allowances).toLocaleString()}</td>
                            <td className="px-6 py-3 text-sm text-red-500">-{Number(p.deductions).toLocaleString()}</td>
                            <td className="px-6 py-3 text-sm font-bold text-gray-900">PKR {Number(p.netSalary).toLocaleString()}</td>
                            <td className="px-6 py-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── HEADCOUNT TAB ── */}
          {activeTab === 'headcount' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Employees', value: employeeStats?.total ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Active', value: employeeStats?.active ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Inactive', value: employeeStats?.inactive ?? 0, color: 'text-red-500', bg: 'bg-red-50' },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} rounded-2xl p-5`}>
                    <p className="text-xs text-gray-500 font-medium mb-2">{s.label}</p>
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Headcount by Department</h2>
                </div>
                {departments.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">No departments found.</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {(isDeptMgr ? departments.filter(d => String(d.id) === String(user?.departmentId)) : departments).map(dept => {
                      const count = dept._count?.employees ?? 0;
                      const total = employeeStats?.total || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={dept.id} className="px-6 py-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-900">{dept.name}</p>
                            <span className="text-sm font-bold text-blue-600">{count} employees</span>
                          </div>
                          <div className="bg-gray-100 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{pct}% of total workforce</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}