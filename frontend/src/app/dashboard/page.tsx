'use client';

import { useEffect, useState } from 'react';
import { useAuth, hasPermission, canManageEmployees, canManagePayroll, canApproveLeaves, isCompanyAdmin } from '@/lib/withAuth';
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
  const { user, loading: authLoading } = useAuth(false);
  const [empStats, setEmpStats] = useState<DashboardStats | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [payroll, setPayroll] = useState<PayrollSummary | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<RecentEmployee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptInactive, setDeptInactive] = useState(false);
  const [myTodayAttendance, setMyTodayAttendance] = useState<any>(null);
  const [myRecentLeaves, setMyRecentLeaves] = useState<any[]>([]);
  const [myLeaveBalance, setMyLeaveBalance] = useState<any[]>([]);
  useEffect(() => {
    if (user) fetchAll();
  }, [user]);
  useEffect(() => {
    const handler = () => { if (user) fetchAll(); };
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
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
        const departmentId = localStorage.getItem("user_departmentId");
        if (employeeId) {
          const [ownAttendance, ownLeaves, ownBalance] = await Promise.allSettled([
            apiCall(`/attendance/employee/${employeeId}`, {}, token),
            apiCall(`/leaves/employee/${employeeId}`, {}, token),
            apiCall(`/leaves/balance/${employeeId}`, {}, token),
          ]);
          if (ownAttendance.status === "fulfilled") {
            const now = new Date();
            const todayStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
            const todayRec = (ownAttendance.value || []).find((r: any) => { if (!r.date) return false; const d = new Date(r.date); const recStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); return recStr === todayStr; });
            setMyTodayAttendance(todayRec || null);
          }
          if (ownLeaves.status === "fulfilled") {
            setMyRecentLeaves((ownLeaves.value || []).slice(0, 5));
          }
          if (ownBalance.status === "fulfilled") {
        }
        }
        if (departmentId) {
          try {
            const dept = await apiCall(`/departments/${departmentId}`, {}, token);
            if (dept?.status === "inactive") setDeptInactive(true);
          } catch {}
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

  if (authLoading || !user) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;


  const attendancePct = attendance?.totalEmployees
    ? Math.round((attendance.present / attendance.totalEmployees) * 100)
    : 0;

  const isPlainEmployee = user?.role === "EMPLOYEE" && !user?.customRoleName;
  return (
    <div className="space-y-6">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .stat-card { transition: all 0.2s ease; animation: fadeUp 0.5s ease forwards; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.1) !important; }
        .action-card { transition: all 0.2s ease; }
        .action-card:hover { transform: translateY(-3px); }
        .leave-item { transition: all 0.15s ease; }
        .leave-item:hover { background: #f0f9ff !important; }
        .emp-item { transition: all 0.15s ease; }
        .emp-item:hover { background: #f0f9ff !important; }
      `}</style>
      {/* Header */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{background:"linear-gradient(135deg,#0f172a,#1e293b,#1d4ed8)"}}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{background:"radial-gradient(circle,white,transparent)",transform:"translate(30%,-30%)"}} />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full opacity-5" style={{background:"radial-gradient(circle,white,transparent)"}} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-2">{user?.companyName}{user?.departmentName ? ` · ${user.departmentName}` : ''}</p>
            <h1 className="text-2xl font-black text-white mb-1">
              Welcome back, {user?.name?.trim()?.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-400 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white font-bold text-sm">{user?.name}</p>
              <p className="text-slate-400 text-xs">{user?.role?.replace(/_/g,' ')}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg" style={{background:"linear-gradient(135deg,#3b82f6,#60a5fa)"}}>
              <span className="text-white">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {deptInactive && (
        <div className="rounded-2xl p-4 flex items-center gap-3 border border-orange-200" style={{background:"linear-gradient(135deg,#fff7ed,#ffedd5)"}}>
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">⚠️</div>
          <div>
            <p className="font-bold text-orange-800 text-sm">Department Inactive</p>
            <p className="text-xs text-orange-600 mt-0.5">Some features may be restricted. Please contact your HR or Company Admin.</p>
          </div>
        </div>
      )}
      {!isPlainEmployee && (<>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card rounded-2xl p-4 relative overflow-hidden" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 8px 30px rgba(59,130,246,0.35)"}}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-100 opacity-80">Total Staff</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{background:"rgba(255,255,255,0.2)"}}>👥</div>
          </div>
          <p className="text-4xl font-black text-white">{empStats?.total ?? 0}</p>
          <div className="flex gap-2 mt-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:"rgba(255,255,255,0.2)",color:"white"}}>✓ {empStats?.active ?? 0} active</span>
          </div>
        </div>

        <div className="stat-card rounded-2xl p-4 relative overflow-hidden" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 30px rgba(16,185,129,0.35)",animationDelay:"0.1s"}}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-green-100 opacity-80">Present Today</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{background:"rgba(255,255,255,0.2)"}}>✅</div>
          </div>
          <p className="text-4xl font-black text-white">{attendance?.present ?? 0}</p>
          <div className="flex gap-2 mt-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:"rgba(255,255,255,0.2)",color:"white"}}>⏰ {attendance?.late ?? 0} late</span>
          </div>
        </div>

        <div className="stat-card rounded-2xl p-4 relative overflow-hidden" style={{background:"linear-gradient(135deg,#d97706,#f59e0b)",boxShadow:"0 8px 30px rgba(245,158,11,0.35)",animationDelay:"0.2s"}}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-100 opacity-80">Pending Leaves</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{background:"rgba(255,255,255,0.2)"}}>🌿</div>
          </div>
          <p className="text-4xl font-black text-white">{pendingLeaves.length}</p>
          <p className="text-xs font-bold mt-4" style={{color:"rgba(255,255,255,0.8)"}}>Awaiting approval</p>
        </div>

        {canManagePayroll(user?.role || '') ? (
          <div className="stat-card rounded-2xl p-4 relative overflow-hidden" style={{background:"linear-gradient(135deg,#7c3aed,#8b5cf6)",boxShadow:"0 8px 30px rgba(139,92,246,0.35)",animationDelay:"0.3s"}}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-100 opacity-80">Pending Payroll</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{background:"rgba(255,255,255,0.2)"}}>💰</div>
            </div>
            <p className="text-4xl font-black text-white">PKR {((payroll?.totalPending ?? 0) / 1000).toFixed(0)}K</p>
            <p className="text-xs font-bold mt-4" style={{color:"rgba(255,255,255,0.8)"}}>{payroll?.totalRecords ?? 0} records</p>
          </div>
        ) : (
          <div className="stat-card rounded-2xl p-4 relative overflow-hidden" style={{background:"linear-gradient(135deg,#dc2626,#ef4444)",boxShadow:"0 8px 30px rgba(239,68,68,0.35)",animationDelay:"0.3s"}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">Absent Today</p>
              <span className="bg-red-100 text-red-500 text-xl w-9 h-9 rounded-xl flex items-center justify-center">❌</span>
            </div>
            <p className="text-3xl font-bold text-red-500">{attendance?.absent ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">{attendance?.late ?? 0} late arrivals</p>
          </div>
        )}
      </div>


      <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-gray-900 text-lg">Today's Attendance</h2>
          <a href="/dashboard/attendance" className="text-xs font-semibold text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-xl">View details →</a>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Present', value: attendance?.present ?? 0, color: 'white', bg: 'linear-gradient(135deg,#059669,#10b981)', shadow: 'rgba(16,185,129,0.3)' },
            { label: 'Absent', value: attendance?.absent ?? 0, color: 'white', bg: 'linear-gradient(135deg,#dc2626,#ef4444)', shadow: 'rgba(239,68,68,0.3)' },
            { label: 'Late', value: attendance?.late ?? 0, color: 'white', bg: 'linear-gradient(135deg,#d97706,#f59e0b)', shadow: 'rgba(245,158,11,0.3)' },
            { label: 'Total', value: attendance?.totalEmployees ?? 0, color: 'white', bg: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', shadow: 'rgba(59,130,246,0.3)' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-3 text-center relative overflow-hidden" style={{background:item.bg,boxShadow:`0 4px 15px ${item.shadow}`}}>
              <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
              <p className="text-2xl font-black text-white">{item.value}</p>
              <p className="text-xs font-bold mt-1" style={{color:"rgba(255,255,255,0.8)"}}>{item.label}</p>
            </div>
          ))}
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
          <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-gray-900 text-lg">Pending Leaves</h2>
                <p className="text-xs text-gray-400 mt-0.5">{pendingLeaves.length} awaiting your decision</p>
              </div>
              <a href="/dashboard/leaves" className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100">View all →</a>
            </div>
            {pendingLeaves.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">✅</div>
                <p className="text-gray-500 font-semibold text-sm">No pending leaves</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingLeaves.map(leave => (
                  <div key={leave.id} className="leave-item flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 text-sm">{leave.employee?.user?.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${(leave.employee as any)?.customRole ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                          {(leave.employee as any)?.customRole?.name || leave.employee?.user?.role?.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleLeaveAction(leave.id, 'approve')}
                        className="text-xs font-bold text-white px-3 py-1.5 rounded-xl transition-all"
                        style={{background:"linear-gradient(135deg,#059669,#10b981)"}}>
                        ✓ Approve
                      </button>
                      <button onClick={() => handleLeaveAction(leave.id, 'reject')}
                        className="text-xs font-bold text-white px-3 py-1.5 rounded-xl transition-all"
                        style={{background:"linear-gradient(135deg,#dc2626,#ef4444)"}}>
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-gray-900 text-lg">Recent Employees</h2>
              <p className="text-xs text-gray-400 mt-0.5">{recentEmployees.length} team members</p>
            </div>
            <a href="/dashboard/employees" className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100">View all →</a>
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
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${emp.customRole ? 'bg-blue-100 text-blue-700' : emp.user?.role === 'COMPANY_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                      {emp.customRole?.name || (emp.user?.role === 'COMPANY_ADMIN' ? 'Admin' : 'Employee')}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${emp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {emp.status === 'active' ? '● Active' : '● ' + emp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      </>)}
      {isPlainEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 rounded-2xl p-5 relative overflow-hidden" style={{background: myTodayAttendance?.checkIn && myTodayAttendance?.checkOut ? "linear-gradient(135deg,#059669,#10b981)" : myTodayAttendance?.checkIn ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "linear-gradient(135deg,#64748b,#94a3b8)", boxShadow:"0 8px 30px rgba(0,0,0,0.1)"}}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
            <p className="text-xs font-bold uppercase tracking-widest text-white opacity-80 mb-3">Today's Attendance</p>
            {myTodayAttendance?.checkIn && myTodayAttendance?.checkOut ? (
              <>
                <p className="text-2xl font-black text-white mb-1">✅ Completed</p>
                <p className="text-xs text-white opacity-80">In: {new Date(myTodayAttendance.checkIn).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} • Out: {new Date(myTodayAttendance.checkOut).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p>
              </>
            ) : myTodayAttendance?.checkIn ? (
              <>
                <p className="text-2xl font-black text-white mb-1">🚪 Checked In</p>
                <p className="text-xs text-white opacity-80">In: {new Date(myTodayAttendance.checkIn).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} — don't forget to check out</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-white mb-1">⏰ Not Checked In</p>
                <p className="text-xs text-white opacity-80">Mark your attendance for today</p>
              </>
            )}
            <a href="/dashboard/attendance" className="inline-block mt-4 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">Go to Attendance →</a>
          </div>
          <div className="lg:col-span-1 bg-white rounded-2xl p-5 border border-gray-100" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Leave Balance</p>
            {myLeaveBalance.length === 0 ? (
              <p className="text-sm text-gray-400">No leave balance found</p>
            ) : (
              <div className="space-y-2">
                {myLeaveBalance.slice(0, 4).map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <p className="text-xs text-gray-600 font-medium">{b.leaveType}</p>
                    <p className="text-sm font-black text-gray-900">{b.remaining}<span className="text-xs text-gray-400 font-normal">/{b.total}</span></p>
                  </div>
                ))}
              </div>
            )}
            <a href="/dashboard/leaves" className="inline-block mt-4 text-blue-600 hover:text-blue-700 text-xs font-bold">Apply for Leave →</a>
          </div>
          <div className="lg:col-span-1 bg-white rounded-2xl p-5 border border-gray-100" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Recent Leave Requests</p>
            {myRecentLeaves.length === 0 ? (
              <p className="text-sm text-gray-400">No leave requests yet</p>
            ) : (
              <div className="space-y-2">
                {myRecentLeaves.map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{l.leaveType}</p>
                      <p className="text-[11px] text-gray-400">{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${l.status === 'approved' ? 'bg-green-100 text-green-700' : l.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{l.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
        <h2 className="font-black text-gray-900 text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            (hasPermission(user, 'attendance', 'view') || isCompanyAdmin(user?.role || '') || canManageEmployees(user?.role || '')) && { label: 'Mark Attendance', icon: '📅', href: '/dashboard/attendance', grad: 'linear-gradient(135deg,#059669,#10b981)', shadow: 'rgba(16,185,129,0.3)' },
            (hasPermission(user, 'leaves', 'view') || isCompanyAdmin(user?.role || '') || canApproveLeaves(user?.role || '')) && { label: 'Apply Leave', icon: '🌿', href: '/dashboard/leaves', grad: 'linear-gradient(135deg,#d97706,#f59e0b)', shadow: 'rgba(245,158,11,0.3)' },
            canManageEmployees(user?.role || '') && { label: 'Add Employee', icon: '👤', href: '/dashboard/employees', grad: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', shadow: 'rgba(59,130,246,0.3)' },
            canManagePayroll(user?.role || '') && { label: 'Process Payroll', icon: '💰', href: '/dashboard/payroll', grad: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', shadow: 'rgba(139,92,246,0.3)' },
          ].filter(Boolean).map((action: any, i) => (
            <a key={i} href={action.href}
              className="action-card rounded-2xl p-4 text-center cursor-pointer text-white relative overflow-hidden"
              style={{background:action.grad,boxShadow:`0 8px 25px ${action.shadow}`}}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
              <p className="text-3xl mb-2">{action.icon}</p>
              <p className="text-sm font-black tracking-tight">{action.label}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}









