'use client';

import { useEffect, useState } from 'react';
import { useAuth, hasPermission, canManageEmployees, canManagePayroll, canApproveLeaves } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface DashboardStats {
  total: number;
  active: number;
  inactive: number;
  hrManagers: number;
  deptManagers: number;
  employees: number;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  totalEmployees: number;
}

interface PayrollSummary {
  totalPaid: number;
  totalPending: number;
  totalRecords: number;
}

interface PendingLeave {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  employee: { user: { name: string; email: string } };
}

interface RecentEmployee {
  id: string;
  employeeCode: string;
  designation: string;
  status: string;
  user: { name: string; email: string; role: string };
  department: { name: string } | null;
}

export default function DashboardPage() {
  const { user } = useAuth(false);
  const [empStats, setEmpStats] = useState<DashboardStats | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [payroll, setPayroll] = useState<PayrollSummary | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<RecentEmployee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const token = getToken() || "";
    const isAdmin = user!.role === "COMPANY_ADMIN";
    const isPlainEmployee = user!.role === "EMPLOYEE" && !user!.customRoleName;
    const hasCustomRole = !!user!.customRoleName;
    try {
      // Plain employee — only own data
      if (isPlainEmployee) {
        const employeeId = localStorage.getItem("user_employeeId");
        if (employeeId) {
          const [ownAttendance, ownLeaves] = await Promise.allSettled([
            apiCall(`/attendance/employee/${employeeId}`, {}, token),
            apiCall(`/leaves/employee/${employeeId}`, {}, token),
          ]);
          // No company stats for plain employees
        }
        setLoading(false);
        return;
      }

      // Company Admin and Custom Roles
      const promises: Promise<any>[] = [];
      const keys: string[] = [];

      if (isAdmin || hasPermission(user, "employees", "view")) {
        promises.push(apiCall("/employees/stats", {}, token)); keys.push("empStats");
        promises.push(apiCall("/employees", {}, token)); keys.push("employees");
      }
      if (isAdmin || hasPermission(user, "attendance", "view")) {
        promises.push(apiCall("/attendance/summary/today", {}, token)); keys.push("attendance");
        promises.push(apiCall("/attendance/date/" + new Date().toISOString().split("T")[0], {}, token)); keys.push("todayAttendance");
      }
      if (isAdmin || hasPermission(user, "leaves", "approve") || hasPermission(user, "leaves", "view")) {
        promises.push(apiCall("/leaves/pending", {}, token)); keys.push("pendingLeaves");
      }
      if (isAdmin || hasPermission(user, "payroll", "view")) {
        promises.push(apiCall("/payroll/summary", {}, token)); keys.push("payroll");
      }

      const results = await Promise.allSettled(promises);
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          const key = keys[i];
          if (key === "empStats") setEmpStats(result.value);
          if (key === "employees") setRecentEmployees(result.value.filter((e: any) => !user?.customRoleName || String(e.user?.id) !== String(user?.id)).slice(0, 5));
          if (key === "attendance") setAttendance(result.value);
          if (key === "todayAttendance") setTodayAttendance(result.value || []);
          if (key === "pendingLeaves") setPendingLeaves(result.value.slice(0, 5));
          if (key === "payroll") setPayroll(result.value);
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (id: string, action: 'approve' | 'reject') => {
    const token = getToken() || '';
    try {
      await apiCall(`/leaves/${id}/${action}`, { method: 'PUT' }, token);
      setPendingLeaves(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const attendancePct = attendance?.totalEmployees
    ? Math.round((attendance.present / attendance.totalEmployees) * 100)
    : 0;

  const isPlainEmployee = user?.role === "EMPLOYEE" && !user?.customRoleName;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {user?.companyName} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {!isPlainEmployee && (<>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Total Staff</p>
            <span className="bg-blue-100 text-blue-600 text-xl w-9 h-9 rounded-xl flex items-center justify-center">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{empStats?.total ?? 0}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Active: {empStats?.active ?? 0}</span>
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Inactive: {empStats?.inactive ?? 0}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {recentEmployees.map((emp: any) => (
              <span key={emp.id} className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${emp.customRole ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {emp.customRole?.name || 'Employee'}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Present Today</p>
            <span className="bg-green-100 text-green-600 text-xl w-9 h-9 rounded-xl flex items-center justify-center">✅</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{attendance?.present ?? 0}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {todayAttendance.filter((r:any) => r.status === 'present').slice(0,3).map((r:any) => (
              <span key={r.id} className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${r.employee?.customRole ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {r.employee?.user?.name?.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Pending Leaves</p>
            <span className="bg-yellow-100 text-yellow-600 text-xl w-9 h-9 rounded-xl flex items-center justify-center">🌿</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{pendingLeaves.length}</p>
          <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
        </div>

        {canManagePayroll(user?.role || '') ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">Pending Payroll</p>
              <span className="bg-purple-100 text-purple-600 text-xl w-9 h-9 rounded-xl flex items-center justify-center">💰</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">PKR {((payroll?.totalPending ?? 0) / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-400 mt-1">{payroll?.totalRecords ?? 0} records</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">Absent Today</p>
              <span className="bg-red-100 text-red-500 text-xl w-9 h-9 rounded-xl flex items-center justify-center">❌</span>
            </div>
            <p className="text-3xl font-bold text-red-500">{attendance?.absent ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">{attendance?.late ?? 0} late arrivals</p>
          </div>
        )}
      </div>


      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Today's Attendance Overview</h2>
          <a href="/dashboard/attendance" className="text-sm text-blue-600 hover:underline">View details →</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Present', value: attendance?.present ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Absent', value: attendance?.absent ?? 0, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Late', value: attendance?.late ?? 0, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          ].map((item, i) => (
            <div key={i} className={`${item.bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-600 text-center">{attendance?.totalEmployees ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1 text-center">Total</p>
            <div className="flex flex-wrap gap-1 mt-2 justify-center">
              {recentEmployees.map((emp: any) => (
                <span key={emp.id} className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${emp.customRole ? 'bg-blue-200 text-blue-800' : 'bg-green-100 text-green-700'}`}>
                  {emp.customRole?.name || 'Employee'}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
          <div className="flex h-full rounded-full overflow-hidden">
            <div className="bg-green-500 transition-all" style={{ width: `${attendance?.totalEmployees ? (attendance.present / attendance.totalEmployees) * 100 : 0}%` }} />
            <div className="bg-yellow-400 transition-all" style={{ width: `${attendance?.totalEmployees ? (attendance.late / attendance.totalEmployees) * 100 : 0}%` }} />
            <div className="bg-red-400 transition-all" style={{ width: `${attendance?.totalEmployees ? (attendance.absent / attendance.totalEmployees) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Present</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>Late</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>Absent</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {canApproveLeaves(user?.role || '') && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Pending Leave Requests</h2>
              <a href="/dashboard/leaves" className="text-sm text-blue-600 hover:underline">View all →</a>
            </div>
            {pendingLeaves.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-gray-400 text-sm">No pending leaves</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaves.map(leave => (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{leave.employee?.user?.name}</p>
                      <p className="text-xs text-gray-500">{leave.leaveType} • {leave.days} day(s)</p>
                      <p className="text-xs text-gray-400">{new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'approve')}
                        className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'reject')}
                        className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Employees</h2>
            <a href="/dashboard/employees" className="text-sm text-blue-600 hover:underline">View all →</a>
          </div>
          {recentEmployees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-gray-400 text-sm">No employees yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEmployees.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                    {emp.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{emp.user?.name}</p>
                    <p className="text-xs text-gray-400">{emp.designation || 'No designation'} {emp.department ? `• ${emp.department.name}` : ''}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${emp.customRole ? 'bg-blue-100 text-blue-700' : emp.user?.role === 'COMPANY_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                      {emp.customRole?.name || (emp.user?.role === 'COMPANY_ADMIN' ? 'Admin' : 'Employee')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {emp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      </>)}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Mark Attendance', icon: '📅', href: '/dashboard/attendance', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
            { label: 'Apply Leave', icon: '🌿', href: '/dashboard/leaves', color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' },
            canManageEmployees(user?.role || '') && { label: 'Add Employee', icon: '👤', href: '/dashboard/employees', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
            canManagePayroll(user?.role || '') && { label: 'Process Payroll', icon: '💰', href: '/dashboard/payroll', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
          ].filter(Boolean).map((action: any, i) => (
            <a key={i} href={action.href}
              className={`${action.color} rounded-xl p-4 text-center transition-colors cursor-pointer`}>
              <p className="text-2xl mb-1">{action.icon}</p>
              <p className="text-sm font-medium">{action.label}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}