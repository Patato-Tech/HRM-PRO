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

type ReportTab = 'attendance' | 'leaves' | 'payroll' | 'headcount' | 'joiners' | 'leavers' | 'current';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const statusColors: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  half_day: 'bg-orange-100 text-orange-700',
  on_leave: 'bg-purple-100 text-purple-700',
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
  const [empReportData, setEmpReportData] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deptFilter2, setDeptFilter2] = useState([]);
  const [roleFilter, setRoleFilter] = useState([]);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

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
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'monthly' | 'weekly'>('daily');
  const [reportWeek, setReportWeek] = useState(new Date().toISOString().split('T')[0]);
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState(6);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

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
      } else if (tab === 'joiners' || tab === 'leavers' || tab === 'current') {
        const emps = await apiCall('/employees', {}, token);
        setEmpReportData(emps || []);
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

  // Fetch employees for attendance report
  useEffect(() => {
    if (!token) return;
    apiCall('/employees', {}, token).then(data => { const isOwnDeptRep = user?.customRoleScope === 'own_department' && user?.departmentId; setEmployees(isOwnDeptRep ? (data || []).filter((e: any) => String(e.departmentId) === String(user.departmentId)) : (data || [])); }).catch(() => {});
  }, [token]);

  // Monthly attendance report fetch
  useEffect(() => {
    if (reportPeriod !== 'monthly' || !token) return;
    setMonthlyLoading(true);
    const fetchMonthly = async () => {
      try {
        const daysInMonth = new Date(reportYear, reportMonth, 0).getDate();
        const allRecords: any[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const date = `${reportYear}-${String(reportMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          try {
            const recs = await apiCall(`/attendance/date/${date}`, {}, token);
            allRecords.push(...(recs || []).map((r: any) => ({ ...r, dateStr: date })));
          } catch {}
        }
        setMonthlyAttendance(allRecords);
      } catch (e) { console.error(e); }
      finally { setMonthlyLoading(false); }
    };
    fetchMonthly();
  }, [reportPeriod, reportMonth, reportYear, token]);

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
                  <div key={i} className="rounded-2xl p-4 relative overflow-hidden"
                    style={{background:["linear-gradient(135deg,#1d4ed8,#3b82f6)","linear-gradient(135deg,#059669,#10b981)","linear-gradient(135deg,#dc2626,#ef4444)","linear-gradient(135deg,#7c3aed,#8b5cf6)"][i%4],boxShadow:"0 4px 15px rgba(0,0,0,0.15)"}}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
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
                        {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : "—"}
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
    { key: 'joiners' as ReportTab, label: '🟢 Joiners' },
    { key: 'leavers' as ReportTab, label: '🔴 Leavers' },
    { key: 'current' as ReportTab, label: '👤 Current' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reports</h1>
          <p className="text-gray-400 text-sm mt-0.5">{isDeptMgr ? 'Department-level reports' : 'Company-wide analytics and summaries'}</p>
        </div>
        <button onClick={async () => {
          const token = getToken() || '';
          const [leaveData, payrollData, deptData, empData] = await Promise.all([
            apiCall('/leaves', {}, token).catch(() => []),
            apiCall('/payroll/summary', {}, token).catch(() => ({})),
            apiCall('/departments', {}, token).catch(() => []),
            apiCall('/employees', {}, token).catch(() => []),
          ]);
          const leavesArr = leaveData || [];
          const paySum = payrollData || {};
          const deptsArr = deptData || [];
          const empsArr = empData || [];
          const win = window.open("", "_blank");
          if (!win) return;
          win.document.write(`<!DOCTYPE html><html><head><title>HR Summary Report</title><style>body{font-family:Arial;padding:30px;color:#111}h1{color:#1e40af;margin-bottom:4px}h2{color:#374151;font-size:15px;margin:20px 0 10px}p.sub{color:#666;font-size:13px;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#1e40af;color:white;padding:10px 12px;text-align:left;font-size:12px}td{padding:9px 12px;border-bottom:1px solid #eee;font-size:13px}tr:nth-child(even){background:#f9fafb}.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600}.footer{margin-top:20px;font-size:12px;color:#999;border-top:1px solid #eee;padding-top:10px}</style></head><body>
          <h1>HR Summary Report</h1>
          <p class="sub">Generated: ${new Date().toLocaleDateString()} &nbsp;|&nbsp; ${new Date().toLocaleTimeString()}</p>
          <h2>📅 Attendance Summary (Today)</h2>
          <table><thead><tr><th>Present</th><th>Absent</th><th>Late</th><th>Half Day</th><th>On Leave</th><th>Total</th></tr></thead>
          <tbody><tr><td>${attendanceSummary?.present ?? 0}</td><td>${attendanceSummary?.absent ?? 0}</td><td>${attendanceSummary?.late ?? 0}</td><td>${(attendanceSummary as any)?.halfDay ?? 0}</td><td>${(attendanceSummary as any)?.onLeave ?? 0}</td><td>${attendanceSummary?.totalEmployees ?? 0}</td></tr></tbody></table>
          <h2>🌿 Leave Summary</h2>
          <table><thead><tr><th>Total</th><th>Pending</th><th>Approved</th><th>Rejected</th></tr></thead>
          <tbody><tr><td>${leavesArr.length}</td><td>${leavesArr.filter((l: any) => l.status === "pending").length}</td><td>${leavesArr.filter((l: any) => l.status === "approved").length}</td><td>${leavesArr.filter((l: any) => l.status === "rejected").length}</td></tr></tbody></table>
          <h2>💰 Payroll Summary</h2>
          <table><thead><tr><th>Total Records</th><th>Paid Amount</th><th>Pending Amount</th><th>Pending Records</th></tr></thead>
          <tbody><tr><td>${paySum.totalRecords ?? 0}</td><td>PKR ${Number(paySum.paidAmount ?? 0).toLocaleString()}</td><td>PKR ${Number(paySum.pendingAmount ?? 0).toLocaleString()}</td><td>${paySum.pendingCount ?? 0}</td></tr></tbody></table>
          <h2>👥 Headcount by Department</h2>
          <table><thead><tr><th>Department</th><th>Employees</th></tr></thead>
          <tbody>${deptsArr.map((d: any) => `<tr><td>${d.name}</td><td>${empsArr.filter((e: any) => String(e.departmentId) === String(d.id)).length}</td></tr>`).join("")}</tbody></table>
          <div class="footer">HRMPro Enterprise &nbsp;|&nbsp; Confidential</div>
          </body></html>`);
          const { default: jsPDF } = await import('jspdf');
          const { default: autoTable } = await import('jspdf-autotable');
          const doc = new jsPDF();
          doc.setFontSize(16); doc.setTextColor(30,64,175);
          doc.text("HR Summary Report", 14, 18);
          doc.setFontSize(9); doc.setTextColor(100,100,100);
          doc.text("Generated: " + new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(), 14, 25);
          let y = 32;
          doc.setFontSize(11); doc.setTextColor(30,64,175);
          doc.text("Attendance Summary (Today)", 14, y); y += 6;
          autoTable(doc, { startY: y, head: [["Present","Absent","Late","Half Day","On Leave","Total"]], body: [[attendanceSummary?.present??0, attendanceSummary?.absent??0, attendanceSummary?.late??0, (attendanceSummary as any)?.halfDay??0, (attendanceSummary as any)?.onLeave??0, attendanceSummary?.totalEmployees??0]], headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9} });
          y = (doc as any).lastAutoTable.finalY + 8;
          doc.setFontSize(11); doc.setTextColor(30,64,175);
          doc.text("Leave Summary", 14, y); y += 6;
          autoTable(doc, { startY: y, head: [["Total","Pending","Approved","Rejected"]], body: [[leavesArr.length, leavesArr.filter((l:any)=>l.status==="pending").length, leavesArr.filter((l:any)=>l.status==="approved").length, leavesArr.filter((l:any)=>l.status==="rejected").length]], headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9} });
          y = (doc as any).lastAutoTable.finalY + 8;
          doc.setFontSize(11); doc.setTextColor(30,64,175);
          doc.text("Payroll Summary", 14, y); y += 6;
          autoTable(doc, { startY: y, head: [["Total Records","Paid Amount","Pending Amount","Pending Count"]], body: [[paySum.totalRecords??0, "PKR "+Number(paySum.paidAmount??0).toLocaleString(), "PKR "+Number(paySum.pendingAmount??0).toLocaleString(), paySum.pendingCount??0]], headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9} });
          y = (doc as any).lastAutoTable.finalY + 8;
          doc.setFontSize(11); doc.setTextColor(30,64,175);
          doc.text("Headcount by Department", 14, y); y += 6;
          autoTable(doc, { startY: y, head: [["Department","Employees"]], body: deptsArr.map((d:any)=>[d.name, empsArr.filter((e:any)=>String(e.departmentId)===String(d.id)).length]), headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9} });
          doc.save("HR_Summary_Report_" + new Date().toISOString().split("T")[0] + ".pdf");
        }} className="text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
          style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 4px 12px rgba(16,185,129,0.3)"}}>
          📄 Download Summary PDF
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all border"
            style={activeTab === tab.key
              ? {background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"white",border:"transparent",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}
              : {background:"white",color:"#6b7280",border:"1px solid #e5e7eb"}}>
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
                  { label: 'Present', value: attendanceSummary?.present ?? 0, grad: 'linear-gradient(135deg,#059669,#10b981)', shadow: 'rgba(16,185,129,0.3)' },
                  { label: 'Absent', value: attendanceSummary?.absent ?? 0, grad: 'linear-gradient(135deg,#dc2626,#ef4444)', shadow: 'rgba(239,68,68,0.3)' },
                  { label: 'Late', value: attendanceSummary?.late ?? 0, grad: 'linear-gradient(135deg,#d97706,#f59e0b)', shadow: 'rgba(245,158,11,0.3)' },
                  { label: 'Half Day', value: (attendanceSummary as any)?.halfDay ?? 0, grad: 'linear-gradient(135deg,#ea580c,#f97316)', shadow: 'rgba(249,115,22,0.3)' },
                  { label: 'On Leave', value: (attendanceSummary as any)?.onLeave ?? 0, grad: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', shadow: 'rgba(139,92,246,0.3)' },
                  { label: 'Total', value: attendanceSummary?.totalEmployees ?? 0, grad: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', shadow: 'rgba(59,130,246,0.3)' },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-4 relative overflow-hidden" style={{background:s.grad,boxShadow:`0 4px 15px ${s.shadow}`}}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"rgba(255,255,255,0.75)"}}>{s.label}</p>
                    <p className="text-3xl font-black text-white">{s.value}</p>
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
 {/* Period Selector */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">📊 Attendance Report</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setReportPeriod("daily")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${reportPeriod === "daily" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                      Daily
                    </button>
                    <button onClick={() => setReportPeriod("weekly")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${reportPeriod === "weekly" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                      Weekly
                    </button>
                    <button onClick={() => setReportPeriod("monthly")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${reportPeriod === "monthly" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                      Monthly
                    </button>
                  </div>
                </div>

                {reportPeriod === "weekly" && (
                  <div>
                    <div className="flex gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Select any day of the week:</label>
                        <input type="date" value={reportWeek} onChange={e => setReportWeek(e.target.value)}
                          className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <button onClick={async () => {
                        const { default: jsPDF } = await import('jspdf');
                        const { default: autoTable } = await import('jspdf-autotable');
                        const selectedDay = new Date(reportWeek);
                        const dayOfWeek = selectedDay.getDay();
                        const monday = new Date(selectedDay);
                        monday.setDate(selectedDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                        const sunday = new Date(monday);
                        sunday.setDate(monday.getDate() + 6);
                        const win = window.open("", "_blank");
                        if (!win) return;
                        const rows = employees.map((emp: any) => {
                          const empRecs = monthlyAttendance.filter((r: any) => {
                            const d = new Date(r.date);
                            return String(r.employeeId) === String(emp.id) && d >= monday && d <= sunday;
                          });
                          const present = empRecs.filter((r: any) => r.status === "present").length;
                          const late = empRecs.filter((r: any) => r.status === "late").length;
                          const halfDay = empRecs.filter((r: any) => r.status === "half_day").length;
                          const onLeave = empRecs.filter((r: any) => r.status === "on_leave").length;
                          const absent = Math.max(0, 6 - present - late - halfDay - onLeave);
                          return `<tr><td>${emp.user.name}</td><td>${emp.employeeCode}</td><td>${present}</td><td>${late}</td><td>${halfDay}</td><td>${onLeave}</td><td>${absent}</td></tr>`;
                        }).join("");
                        const doc = new jsPDF();
                        doc.setFontSize(14); doc.setTextColor(30,64,175);
                        doc.text("Weekly Attendance Report", 14, 18);
                        doc.setFontSize(9); doc.setTextColor(100,100,100);
                        doc.text("Week: " + monday.toLocaleDateString() + " - " + sunday.toLocaleDateString() + "   |   Generated: " + new Date().toLocaleDateString(), 14, 25);
                        autoTable(doc, { startY: 30, head: [["Employee","Code","Present","Late","Half Day","On Leave","Absent"]], body: employees.map((emp) => { const empRecs2 = monthlyAttendance.filter((r) => { const d = new Date(r.date); return String(r.employeeId) === String(emp.id) && d >= monday && d <= sunday; }); return [emp.user.name, emp.employeeCode, empRecs2.filter(r=>r.status==="present").length, empRecs2.filter(r=>r.status==="late").length, empRecs2.filter(r=>r.status==="half_day").length, empRecs2.filter(r=>r.status==="on_leave").length, Math.max(0,6-empRecs2.filter(r=>r.status==="present").length-empRecs2.filter(r=>r.status==="late").length-empRecs2.filter(r=>r.status==="half_day").length-empRecs2.filter(r=>r.status==="on_leave").length)]; }), headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9}, alternateRowStyles:{fillColor:[249,250,251]} });
                        doc.save("Weekly_Attendance_" + monday.toISOString().split("T")[0] + ".pdf");
                      }} className="text-white px-4 py-2 rounded-xl text-sm font-bold self-end" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                        📄 Export PDF
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            {["Employee", "Code", "Present", "Late", "Half Day", "On Leave", "Absent"].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {employees.map((emp: any) => {
                            const selectedDay = new Date(reportWeek);
                            const dayOfWeek = selectedDay.getDay();
                            const monday = new Date(selectedDay);
                            monday.setDate(selectedDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                            const sunday = new Date(monday);
                            sunday.setDate(monday.getDate() + 6);
                            const empRecs = monthlyAttendance.filter((r: any) => {
                              const d = new Date(r.date);
                              return String(r.employeeId) === String(emp.id) && d >= monday && d <= sunday;
                            });
                            const present = empRecs.filter((r: any) => r.status === "present").length;
                            const late = empRecs.filter((r: any) => r.status === "late").length;
                            const halfDay = empRecs.filter((r: any) => r.status === "half_day").length;
                            const onLeave = empRecs.filter((r: any) => r.status === "on_leave").length;
                            const absent = Math.max(0, 6 - present - late - halfDay - onLeave);
                            return (
                              <tr key={emp.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <p className="text-sm font-semibold text-gray-900">{emp.user.name}</p>
                                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{emp.customRole?.name || "Employee"}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">{emp.employeeCode}</td>
                                <td className="px-4 py-3"><span className="text-sm font-bold text-green-600">{present}</span></td>
                                <td className="px-4 py-3"><span className="text-sm font-bold text-yellow-600">{late}</span></td>
                                <td className="px-4 py-3"><span className="text-sm font-bold text-orange-500">{halfDay}</span></td>
                                <td className="px-4 py-3"><span className="text-sm font-bold text-purple-600">{onLeave}</span></td>
                                <td className="px-4 py-3"><span className="text-sm font-bold text-red-500">{absent}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {reportPeriod === "monthly" && (
                  <div>
                    <div className="flex gap-3 mb-4">
                      <select value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))}
                        className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i) => (
                          <option key={i} value={i+1}>{m}</option>
                        ))}
                      </select>
                      <select value={reportYear} onChange={e => setReportYear(Number(e.target.value))}
                        className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {[2026,2025,2024,2023].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select value={workDaysPerWeek} onChange={e => setWorkDaysPerWeek(Number(e.target.value))}
                        className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value={5}>5 Days (Mon-Fri)</option>
                        <option value={6}>6 Days (Mon-Sat)</option>
                        <option value={7}>7 Days (All)</option>
                      </select>
                      <button onClick={async () => {
                        const { default: jsPDF } = await import('jspdf');
                        const { default: autoTable } = await import('jspdf-autotable');
                        const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                        const rows = employees.map((emp: any) => {
                          const empRecs = monthlyAttendance.filter((r: any) => String(r.employeeId) === String(emp.id));
                          const present = empRecs.filter((r: any) => r.status === "present").length;
                          const late = empRecs.filter((r: any) => r.status === "late").length;
                          const halfDay = empRecs.filter((r: any) => r.status === "half_day").length;
                          const absent = empRecs.filter((r: any) => r.status === "absent").length;
                          const total = present + late + halfDay + absent;
                          const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
                          return `<tr><td>${emp.user.name}</td><td>${emp.employeeCode}</td><td>${present}</td><td>${late}</td><td>${halfDay}</td><td>${absent}</td><td>${rate}%</td></tr>`;
                        }).join("");
                        const doc = new jsPDF();
                        doc.setFontSize(14); doc.setTextColor(30,64,175);
                        doc.text("Attendance Report — " + MONTHS[reportMonth-1] + " " + reportYear, 14, 18);
                        doc.setFontSize(9); doc.setTextColor(100,100,100);
                        doc.text("Generated: " + new Date().toLocaleDateString(), 14, 25);
                        autoTable(doc, { startY: 30, head: [["Employee","Code","Present","Late","Half Day","Absent","Rate"]], body: employees.map((emp) => { const empRecs3 = monthlyAttendance.filter((r) => String(r.employeeId) === String(emp.id)); const p=empRecs3.filter(r=>r.status==="present").length; const l=empRecs3.filter(r=>r.status==="late").length; const h=empRecs3.filter(r=>r.status==="half_day").length; const a=empRecs3.filter(r=>r.status==="absent").length; const t=p+l+h+a; const rate=t>0?Math.round(((p+l)/t)*100):0; return [emp.user.name, emp.employeeCode, p, l, h, a, rate+"%"]; }), headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9}, alternateRowStyles:{fillColor:[249,250,251]} });
                        doc.save("Monthly_Attendance_" + MONTHS[reportMonth-1] + "_" + reportYear + ".pdf");
                      }} className="text-white px-4 py-2 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                        📄 Export PDF
                      </button>
                    </div>

                    {monthlyLoading ? (
                      <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              {["Employee", "Code", "Present", "Late", "Half Day", "On Leave", "Absent", "Rate"].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {employees.map((emp: any) => {
                              const empRecs = monthlyAttendance.filter((r: any) => String(r.employeeId) === String(emp.id));
                              const present = empRecs.filter((r: any) => r.status === "present").length;
                              const late = empRecs.filter((r: any) => r.status === "late").length;
                              const halfDay = empRecs.filter((r: any) => r.status === "half_day").length;
                              const absent = empRecs.filter((r: any) => r.status === "absent").length;
                              const onLeave = empRecs.filter((r: any) => r.status === "on_leave").length;
                              const daysInMonth = new Date(reportYear, reportMonth, 0).getDate();
                              let workingDays = 0;
                              for (let d = 1; d <= daysInMonth; d++) {
                                const day = new Date(reportYear, reportMonth - 1, d).getDay();
                                if (workDaysPerWeek === 7) workingDays++;
                                else if (workDaysPerWeek === 6 && day !== 0) workingDays++;
                                else if (workDaysPerWeek === 5 && day !== 0 && day !== 6) workingDays++;
                              }
                              const actualAbsent = Math.max(0, workingDays - present - late - halfDay - onLeave);
                              const total = present + late + halfDay + onLeave + actualAbsent;
                              const rate = total > 0 ? Math.round(((present + late + onLeave) / total) * 100) : 0;
                              return (
                                <tr key={emp.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-gray-900">{emp.user.name}</p>
                                    <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{emp.customRole?.name || "Employee"}</span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">{emp.employeeCode}</td>
                                  <td className="px-4 py-3"><span className="text-sm font-bold text-green-600">{present}</span></td>
                                  <td className="px-4 py-3"><span className="text-sm font-bold text-yellow-600">{late}</span></td>
                                  <td className="px-4 py-3"><span className="text-sm font-bold text-orange-500">{halfDay}</span></td>
                                  <td className="px-4 py-3"><span className="text-sm font-bold text-purple-600">{onLeave}</span></td>
                                  <td className="px-4 py-3"><span className="text-sm font-bold text-red-500">{actualAbsent}</span></td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${rate}%` }}></div>
                                      </div>
                                      <span className="text-sm font-bold text-gray-900">{rate}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {reportPeriod === "daily" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">Select date:</label>
                      <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)}
                        className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                      <span className="text-sm text-gray-400">{attendanceRecords.length} records</span>
                    </div>
                    <button onClick={async () => {
                      const { default: jsPDF } = await import('jspdf');
                      const { default: autoTable } = await import('jspdf-autotable');
                      const doc = new jsPDF();
                      doc.setFontSize(14); doc.setTextColor(30,64,175);
                      doc.text("Daily Attendance Report", 14, 18);
                      doc.setFontSize(9); doc.setTextColor(100,100,100);
                      doc.text("Date: " + attendanceDate + "   |   Generated: " + new Date().toLocaleDateString(), 14, 25);
                      autoTable(doc, { startY: 30, head: [["Employee","Code","Status","Check In","Check Out"]], body: attendanceRecords.map(r => [r.employee?.user?.name||"-", r.employee?.employeeCode||"-", r.status, r.checkIn ? new Date(r.checkIn).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—", r.checkOut ? new Date(r.checkOut).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—"]), headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9}, alternateRowStyles:{fillColor:[249,250,251]} });
                      doc.save("Daily_Attendance_" + attendanceDate + ".pdf");
                    }} className="text-white px-4 py-2 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                      📄 Export PDF
                    </button>
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
                                  {r.status === 'half_day' ? 'Half Day' : r.status === 'on_leave' ? 'On Leave' : r.status === 'present' ? 'Present' : r.status === 'late' ? 'Late' : r.status === 'absent' ? 'Absent' : r.status}
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
              )}
            </div>
          )}
          {activeTab === 'leaves' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total', value: leaveRecords.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Pending', value: leaveRecords.filter(l => l.status === 'PENDING').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { label: 'Approved', value: leaveRecords.filter(l => l.status === 'APPROVED').length, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Rejected', value: leaveRecords.filter(l => l.status === 'REJECTED').length, color: 'text-red-500', bg: 'bg-red-50' },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-4 relative overflow-hidden"
                    style={{background:["linear-gradient(135deg,#1d4ed8,#3b82f6)","linear-gradient(135deg,#d97706,#f59e0b)","linear-gradient(135deg,#059669,#10b981)","linear-gradient(135deg,#dc2626,#ef4444)"][i%4],boxShadow:["0 4px 15px rgba(59,130,246,0.3)","0 4px 15px rgba(245,158,11,0.3)","0 4px 15px rgba(16,185,129,0.3)","0 4px 15px rgba(239,68,68,0.3)"][i%4]}}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"rgba(255,255,255,0.75)"}}>{s.label}</p>
                    <p className="text-3xl font-black text-white">{s.format ? "PKR "+(s.value/1000).toFixed(0)+"K" : s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                  <p className="font-semibold text-gray-900 flex-1">Leave Records</p>
                  <button onClick={async () => {
                    const { default: jsPDF } = await import('jspdf');
                    const { default: autoTable } = await import('jspdf-autotable');
                    const doc = new jsPDF();
                    doc.setFontSize(14); doc.setTextColor(30,64,175);
                    doc.text("Leave Records Report", 14, 18);
                    doc.setFontSize(9); doc.setTextColor(100,100,100);
                    doc.text("Generated: " + new Date().toLocaleDateString() + "   |   Total: " + filteredLeaves.length + " records", 14, 25);
                    autoTable(doc, { startY: 30, head: [["Employee","Leave Type","Days","Status"]], body: filteredLeaves.map(l => [l.employee?.user?.name||"-", l.leaveType, l.days, l.status]), headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9}, alternateRowStyles:{fillColor:[249,250,251]} });
                    doc.save("Leave_Records_" + new Date().toISOString().split("T")[0] + ".pdf");
                  }} className="text-white px-3 py-2 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                    📄 Export PDF
                  </button>
                  <select
                    value={leaveFilter}
                    onChange={e => setLeaveFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="APPROVED">Approved</option>
                    <option value="CANCELLED">Cancelled</option>
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
                                {leave.status ? leave.status.charAt(0).toUpperCase() + leave.status.slice(1) : "—"}
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
                  <div key={i} className="rounded-2xl p-4 relative overflow-hidden"
                    style={{background:["linear-gradient(135deg,#1d4ed8,#3b82f6)","linear-gradient(135deg,#059669,#10b981)","linear-gradient(135deg,#dc2626,#ef4444)","linear-gradient(135deg,#7c3aed,#8b5cf6)"][i%4],boxShadow:"0 4px 15px rgba(0,0,0,0.15)"}}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"rgba(255,255,255,0.75)"}}>{s.label}</p>
                    <p className="text-2xl font-black text-white">
                      {s.format ? `PKR ${(Number(s.value)/1000).toFixed(0)}K` : s.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-gray-900 flex-1">Monthly Payroll</p>
                  <button onClick={async () => {
                    const { default: jsPDF } = await import('jspdf');
                    const { default: autoTable } = await import('jspdf-autotable');
                    const doc = new jsPDF();
                    doc.setFontSize(14); doc.setTextColor(30,64,175);
                    doc.text("Payroll Report — " + MONTH_NAMES[payrollMonth-1] + " " + payrollYear, 14, 18);
                    doc.setFontSize(9); doc.setTextColor(100,100,100);
                    doc.text("Generated: " + new Date().toLocaleDateString() + "   |   Total: " + payrollRecords.length + " records", 14, 25);
                    autoTable(doc, { startY: 30, head: [["Employee","Basic","Allowances","Deductions","Net Salary","Status"]], body: payrollRecords.map(p => [p.employee?.user?.name||"-", "PKR "+Number(p.basic).toLocaleString(), "PKR "+Number(p.allowances).toLocaleString(), "PKR "+Number(p.deductions).toLocaleString(), "PKR "+Number(p.netSalary).toLocaleString(), p.status]), headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9}, alternateRowStyles:{fillColor:[249,250,251]} });
                    doc.save("Payroll_" + MONTH_NAMES[payrollMonth-1] + "_" + payrollYear + ".pdf");
                  }} className="text-white px-3 py-2 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                    📄 Export PDF
                  </button>
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
                                {p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : "—"}
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
                  <div key={i} className="rounded-2xl p-4 relative overflow-hidden"
                    style={{background:["linear-gradient(135deg,#1d4ed8,#3b82f6)","linear-gradient(135deg,#d97706,#f59e0b)","linear-gradient(135deg,#059669,#10b981)","linear-gradient(135deg,#dc2626,#ef4444)"][i%4],boxShadow:["0 4px 15px rgba(59,130,246,0.3)","0 4px 15px rgba(245,158,11,0.3)","0 4px 15px rgba(16,185,129,0.3)","0 4px 15px rgba(239,68,68,0.3)"][i%4]}}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"rgba(255,255,255,0.75)"}}>{s.label}</p>
                    <p className="text-3xl font-black text-white">{s.format ? "PKR "+(s.value/1000).toFixed(0)+"K" : s.value}</p>
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
          {(activeTab === 'joiners' || activeTab === 'leavers' || activeTab === 'current') && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-900 mb-4">
                  {activeTab === 'joiners' ? '🟢 List of Joiners' : activeTab === 'leavers' ? '🔴 List of Leavers' : '👤 Current Employees'}
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {activeTab === 'joiners' && (<>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">From Date</label>
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">To Date</label>
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </>)}
                  <div className="relative">
                    <label className="text-xs text-gray-500 mb-1 block">Department</label>
                    <button type="button" onClick={() => { setShowDeptDropdown(!showDeptDropdown); setShowRoleDropdown(false); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                      <span>{deptFilter2.length === 0 ? 'All Departments' : deptFilter2.length + ' selected'}</span>
                      <span className="text-gray-400">▼</span>
                    </button>
                    {showDeptDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-2 max-h-48 overflow-y-auto">
                        <button type="button" onClick={() => setDeptFilter2([])}
                          className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg mb-1">Clear all</button>
                        {departments.map((d) => (
                          <label key={d.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input type="checkbox" checked={deptFilter2.includes(String(d.id))}
                              onChange={e => setDeptFilter2(prev => e.target.checked ? [...prev, String(d.id)] : prev.filter(x => x !== String(d.id)))}
                              className="rounded" />
                            <span className="text-sm text-gray-700">{d.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <label className="text-xs text-gray-500 mb-1 block">Role</label>
                    <button type="button" onClick={() => { setShowRoleDropdown(!showRoleDropdown); setShowDeptDropdown(false); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                      <span>{roleFilter.length === 0 ? 'All Roles' : roleFilter.length + ' selected'}</span>
                      <span className="text-gray-400">▼</span>
                    </button>
                    {showRoleDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-2">
                        <button type="button" onClick={() => setRoleFilter([])}
                          className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg mb-1">Clear all</button>
                        {[
                          { v: 'EMPLOYEE', l: 'Employee' },
                          ...Array.from(new Set(empReportData.filter((e) => e.customRole?.name).map((e) => e.customRole.name)))
                            .map((name) => ({ v: name, l: name }))
                        ].map(r => (
                          <label key={r.v} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input type="checkbox" checked={roleFilter.includes(r.v)}
                              onChange={e => setRoleFilter(prev => e.target.checked ? [...prev, r.v] : prev.filter(x => x !== r.v))}
                              className="rounded" />
                            <span className="text-sm text-gray-700">{r.l}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    {activeTab === 'joiners' ? '🟢 Joiners Report' : activeTab === 'leavers' ? '🔴 Leavers Report' : '👤 Current Employees Report'}
                  </p>
                  <button onClick={async () => {
                    let filtered = empReportData;
                    if (activeTab === 'joiners') filtered = filtered.filter((e) => e.status === 'active' || e.status === 'sabbatical');
                    if (activeTab === 'leavers') filtered = filtered.filter((e) => e.status === 'resigned' || e.status === 'terminated');
                    if (activeTab === 'current') filtered = filtered.filter((e) => e.status === 'active' || e.status === 'sabbatical');
                    if (deptFilter2.length > 0) filtered = filtered.filter((e) => deptFilter2.includes(String(e.departmentId)));
                    if (roleFilter.length > 0) filtered = filtered.filter((e) => roleFilter.includes(e.customRole?.name || e.user?.role || ''));
                    if (activeTab === 'joiners' && dateFrom) filtered = filtered.filter((e) => new Date(e.joinDate) >= new Date(dateFrom));
                    if (activeTab === 'joiners' && dateTo) filtered = filtered.filter((e) => new Date(e.joinDate) <= new Date(dateTo));
                    const title = activeTab === 'joiners' ? 'Joiners Report' : activeTab === 'leavers' ? 'Leavers Report' : 'Current Employees Report';
                    const { default: jsPDF } = await import('jspdf');
                    const { default: autoTable } = await import('jspdf-autotable');
                    const doc = new jsPDF();
                    doc.setFontSize(16);
                    doc.setTextColor(30, 64, 175);
                    doc.text(title, 14, 20);
                    doc.setFontSize(9);
                    doc.setTextColor(100, 100, 100);
                    doc.text('Company: ' + (user?.companyName || '-') + '   |   Generated: ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() + '   |   Total: ' + filtered.length + ' employees', 14, 28);
                    autoTable(doc, {
                      startY: 34,
                      head: [['Name', 'Email', 'Code', 'Department', 'Role', 'Status', 'Join Date']],
                      body: filtered.map(emp => [
                        emp.user?.name || '-',
                        emp.user?.email || '-',
                        emp.employeeCode,
                        emp.department?.name || '-',
                        emp.customRole?.name || emp.user?.role?.replace(/_/g, ' ') || '-',
                        emp.status.charAt(0).toUpperCase() + emp.status.slice(1),
                        new Date(emp.joinDate).toLocaleDateString()
                      ]),
                      headStyles: { fillColor: [30, 64, 175], fontSize: 9 },
                      bodyStyles: { fontSize: 9 },
                      alternateRowStyles: { fillColor: [249, 250, 251] },
                    });
                    doc.save(title.replace(/ /g, '_') + '_' + new Date().toISOString().split('T')[0] + '.pdf');
                  }} className="text-white px-4 py-2 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                    📄 Export PDF
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Join Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(() => {
                        let filtered = empReportData;
                        if (activeTab === 'joiners') filtered = filtered.filter((e) => e.status === 'active' || e.status === 'sabbatical');
                        if (activeTab === 'leavers') filtered = filtered.filter((e) => e.status === 'resigned' || e.status === 'terminated');
                        if (activeTab === 'current') filtered = filtered.filter((e) => e.status === 'active' || e.status === 'sabbatical');
                        if (deptFilter2.length > 0) filtered = filtered.filter((e) => deptFilter2.includes(String(e.departmentId)));
                        if (roleFilter.length > 0) filtered = filtered.filter((e) => roleFilter.includes(e.customRole?.name || e.user?.role || ""));
                        if (activeTab === 'joiners' && dateFrom) filtered = filtered.filter((e) => new Date(e.joinDate) >= new Date(dateFrom));
                        if (activeTab === 'joiners' && dateTo) filtered = filtered.filter((e) => new Date(e.joinDate) <= new Date(dateTo));
                        if (filtered.length === 0) return (
                          <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No employees found.</td></tr>
                        );
                        return filtered.map((emp) => (
                          <tr key={emp.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                                  {emp.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{emp.user?.name}</p>
                                  <p className="text-xs text-gray-400">{emp.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.employeeCode}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.department?.name || 'Company Wide'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.customRole?.name || emp.user?.role?.replace(/_/g, ' ')}</td>
                            <td className="px-6 py-4">
                              <span className={"text-xs px-2.5 py-1 rounded-full font-semibold " + (emp.status === 'active' ? 'bg-green-100 text-green-700' : emp.status === 'sabbatical' ? 'bg-blue-100 text-blue-700' : emp.status === 'resigned' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700')}>
                                {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(emp.joinDate).toLocaleDateString()}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}















