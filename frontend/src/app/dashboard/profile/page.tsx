'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface PayrollRecord {
  id: number; month: number; year: number;
  basic: number; allowances: number; deductions: number;
  netSalary: number; status: 'PENDING' | 'APPROVED' | 'PAID';
}

interface EmployeeInfo {
  id: number; employeeCode: string; designation: string;
  salary: number; joinDate: string;
  department?: { name: string } | null;
  customRole?: { name: string } | null;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ROLE_LABELS: Record<string, string> = {
  COMPANY_ADMIN: 'Company Admin',
  EMPLOYEE: 'Employee',
};

const ROLE_COLORS: Record<string, string> = {
  COMPANY_ADMIN: 'bg-purple-100 text-purple-700',
  EMPLOYEE: 'bg-green-100 text-green-700',
};

type TabKey = 'info' | 'security' | 'payroll';

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
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
    if (user) {
      setEditName(user.name || '');
      fetchEmployeeInfo();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'payroll' && user.employeeId) {
      setPayrollLoading(true);
      apiCall(`/payroll/employee/${user.employeeId}`, {}, getToken() || '')
        .then(data => setPayrolls(data || []))
        .catch(() => setPayrolls([]))
        .finally(() => setPayrollLoading(false));
    }
  }, [activeTab, user]);

  const fetchEmployeeInfo = async () => {
    if (!user?.employeeId) return;
    try {
      const token = getToken() || '';
      const data = await apiCall(`/employees/${user.employeeId}`, {}, token);
      setEmployeeInfo(data);
    } catch (e) { console.error(e); }
  };

  const handleSaveName = async () => {
    setNameError('');
    if (!editName.trim()) { setNameError('Name cannot be empty.'); return; }
    setNameLoading(true);
    try {
      const token = getToken() || '';
      await apiCall('/auth/profile', { method: 'PUT', body: JSON.stringify({ name: editName.trim() }) }, token);
      localStorage.setItem('user_name', editName.trim());
      showToast('Profile updated!');
    } catch (e: any) { setNameError(e?.message || 'Failed to update.'); }
    finally { setNameLoading(false); }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { setPwError('All fields are required.'); return; }
    if (pwForm.newPw.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      const token = getToken() || '';
      await apiCall('/auth/profile/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      }, token);
      setPwForm({ current: '', newPw: '', confirm: '' });
      showToast('Password changed!');
    } catch (e: any) { setPwError(e?.message || 'Failed to change password.'); }
    finally { setPwLoading(false); }
  };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  const isAdmin = user.role === 'COMPANY_ADMIN';
  const roleName = user.customRoleName || ROLE_LABELS[user.role] || user.role;
  const roleColor = user.customRoleName ? 'bg-blue-100 text-blue-700' : (ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600');

  const totalEarnedThisYear = payrolls
    .filter(p => p.year === new Date().getFullYear() && (p.status === 'PAID' || p.status === 'APPROVED'))
    .reduce((sum, p) => sum + (p.netSalary || p.basic + p.allowances - p.deductions), 0);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'info', label: '👤 My Info' },
    { key: 'security', label: '🔒 Security' },
    ...(!isAdmin ? [{ key: 'payroll' as TabKey, label: '💰 Payroll History' }] : []),
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {toast && (
        <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          ✅ {toast}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-lg">
            {user.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleColor}`}>{roleName}</span>
              {employeeInfo?.employeeCode && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{employeeInfo.employeeCode}</span>
              )}
              {employeeInfo?.department?.name && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">🏢 {employeeInfo.department.name}</span>
              )}
              {user.companyName && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">🏛️ {user.companyName}</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {employeeInfo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100">
            {[
              { label: 'Employee Code', value: employeeInfo.employeeCode || '—' },
              { label: 'Department', value: employeeInfo.department?.name || 'Company Wide' },
              { label: 'Current Salary', value: employeeInfo.salary ? `PKR ${employeeInfo.salary.toLocaleString()}` : '—' },
              { label: 'Joined', value: employeeInfo.joinDate ? new Date(employeeInfo.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* MY INFO TAB */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">Personal Details</h2>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
              className="w-full text-gray-900 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Email Address</label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400">{user.email}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Designation</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">{user.designation || employeeInfo?.designation || 'Not set'}</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Role</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">{roleName}</div>
            </div>
          </div>
          {employeeInfo && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Department</label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">{employeeInfo.department?.name || 'Company Wide'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Employee Code</label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">{employeeInfo.employeeCode}</div>
              </div>
            </div>
          )}
          {employeeInfo?.salary && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Current Salary</label>
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm font-semibold text-green-700">PKR {employeeInfo.salary.toLocaleString()}</div>
            </div>
          )}
          {employeeInfo?.joinDate && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Join Date</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">{new Date(employeeInfo.joinDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Company</label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">{user.companyName || '—'}</div>
          </div>
          {nameError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm">{nameError}</div>}
          <button onClick={handleSaveName} disabled={nameLoading || editName.trim() === user.name}
            className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all">
            {nameLoading ? 'Saving...' : 'Update Name'}
          </button>
          {employeeInfo && !isAdmin && (
            <button onClick={() => {
              const win = window.open("", "_blank");
              if (!win) return;
              const today = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
              win.document.write(`<!DOCTYPE html><html><head><title>Salary Certificate</title><style>*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{font-family:Arial,sans-serif;padding:40px;color:#111;font-size:12px}.hdr{text-align:center;border-bottom:4px solid #1e40af;padding-bottom:20px;margin-bottom:30px}.co{font-size:26px;font-weight:900;color:#1e40af}.sub{font-size:12px;color:#6b7280;margin-top:4px}.title{font-size:18px;font-weight:800;text-align:center;background:#1e40af;color:#fff;padding:12px;border-radius:8px;margin:20px 0;letter-spacing:2px;text-transform:uppercase}.body{line-height:2;font-size:13px;text-align:justify;margin:20px 0}.highlight{font-weight:800;color:#1e40af}.table{width:100%;border-collapse:collapse;margin:20px 0}.table td{padding:10px 14px;border:1px solid #e5e7eb;font-size:12px}.table tr:nth-child(even) td{background:#f9fafb}.table td:first-child{font-weight:700;color:#6b7280;width:40%;text-transform:uppercase;font-size:11px}.sigs{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:60px}.sig{text-align:center}.sl{border-top:1.5px solid #374151;padding-top:6px;margin-top:40px}.foot{text-align:center;margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af}@media print{@page{margin:15mm}}</style></head><body>
              <div class="hdr"><div class="co">${user?.companyName||"Company"}</div><div class="sub">Human Resources Department</div></div>
              <div class="title">Salary Certificate</div>
              <p class="body">This is to certify that <span class="highlight">${user?.name}</span> is a permanent employee of <span class="highlight">${user?.companyName||"our organization"}</span>. The details of employment are as follows:</p>
              <table class="table">
              <tr><td>Employee Name</td><td>${user?.name}</td></tr>
              <tr><td>Employee Code</td><td>${employeeInfo?.employeeCode||"-"}</td></tr>
              <tr><td>Designation</td><td>${employeeInfo?.designation||user?.designation||"-"}</td></tr>
              <tr><td>Department</td><td>${employeeInfo?.department?.name||"Company Wide"}</td></tr>
              <tr><td>Date of Joining</td><td>${employeeInfo?.joinDate ? new Date(employeeInfo.joinDate).toLocaleDateString("en-US",{day:"numeric",month:"long",year:"numeric"}) : "-"}</td></tr>
              <tr><td>Employment Status</td><td><strong>Active</strong></td></tr>
              <tr><td>Monthly Salary</td><td><strong>PKR ${employeeInfo?.salary?.toLocaleString()||"-"}</strong></td></tr>
              </table>
              <p class="body">This certificate is issued on <span class="highlight">${today}</span> at the request of the employee for their personal use.</p>
              <div class="sigs"><div class="sig"><div class="sl"><div style="font-size:10px;color:#6b7280;text-transform:uppercase">Employee Signature</div><div style="font-weight:700;margin-top:4px">${user?.name}</div></div></div><div class="sig"><div class="sl"><div style="font-size:10px;color:#6b7280;text-transform:uppercase">Authorized Signature</div><div style="font-weight:700;margin-top:4px">${user?.companyName}</div><div style="font-size:10px;color:#6b7280">HR Department</div></div></div></div>
              <div class="foot">This is a computer-generated certificate. Issued on ${today}.</div>
              </body></html>`);
              win.document.close();
              setTimeout(() => win.print(), 500);
            }}
            className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl py-3 text-sm font-semibold transition-all mt-2">
            📄 Generate Salary Certificate
            </button>
          )}
          {employeeInfo && !isAdmin && (
            <div className="border-t border-gray-100 pt-3 mt-1">
              <p className="text-xs font-semibold text-gray-500 mb-2">Generate Draft Salary Slip</p>
              <div className="flex gap-2 mb-2">
                <select id="draftMonth" defaultValue={new Date().getMonth()+1}
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i) => (
                    <option key={i} value={i+1}>{m}</option>
                  ))}
                </select>
                <select id="draftYear" defaultValue={new Date().getFullYear()}
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {[2026,2025,2024,2023].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button onClick={() => {
                const month = Number((document.getElementById("draftMonth") as HTMLSelectElement)?.value || new Date().getMonth()+1);
                const year = Number((document.getElementById("draftYear") as HTMLSelectElement)?.value || new Date().getFullYear());
                const MN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                const salary = employeeInfo?.salary || 0;
                const eobi = Math.round(salary * 0.01);
                const net = salary - eobi;
                const win = window.open("", "_blank");
                if (!win) return;
                win.document.write(`<!DOCTYPE html><html><head><title>Draft Salary Slip</title><style>*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{font-family:Arial,sans-serif;padding:30px;color:#111;font-size:12px}.hdr{display:flex;justify-content:space-between;align-items:center;padding-bottom:15px;border-bottom:4px solid #1e40af;margin-bottom:20px}.co{font-size:22px;font-weight:900;color:#1e40af}.badge{background:#f59e0b;color:#fff;padding:10px 18px;border-radius:8px;text-align:center}.badge-m{font-size:16px;font-weight:900}.draft-watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:80px;font-weight:900;color:rgba(239,68,68,0.08);pointer-events:none;z-index:0;white-space:nowrap}.emp{background:#eff6ff;border-left:5px solid #1e40af;padding:14px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px}.ef label{font-size:10px;color:#6b7280;text-transform:uppercase;display:block}.ef span{font-size:13px;font-weight:700}.tbls{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}table{width:100%;border-collapse:collapse}.th-e{background:#059669;color:#fff;padding:9px 12px;font-size:11px;font-weight:800;text-transform:uppercase}.th-d{background:#dc2626;color:#fff;padding:9px 12px;font-size:11px;font-weight:800;text-transform:uppercase}td{padding:7px 12px;font-size:11px;border-bottom:1px solid #f3f4f6}.r{text-align:right;font-weight:600}.even td{background:#f9fafb}.te td{background:#d1fae5!important;font-weight:800;color:#065f46;border-top:2px solid #059669}.td td{background:#fee2e2!important;font-weight:800;color:#991b1b;border-top:2px solid #dc2626}.net{background:linear-gradient(135deg,#92400e,#d97706);color:#fff;padding:18px;border-radius:10px;text-align:center;margin:16px 0}.net-a{font-size:32px;font-weight:900;margin:6px 0}.draft-note{background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:12px;margin:16px 0;font-size:11px;color:#92400e;text-align:center;font-weight:700}.sigs{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:50px}.sig{text-align:center}.sl{border-top:1.5px solid #374151;padding-top:6px;margin-top:40px}.foot{text-align:center;margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af}@media print{@page{margin:10mm}}</style></head><body>
                <div class="draft-watermark">DRAFT</div>
                <div class="hdr"><div><div class="co">${user?.companyName||"Company"}</div><div style="font-size:11px;color:#6b7280">Official Salary Slip (Draft)</div></div><div class="badge"><div style="font-size:10px;opacity:.8">DRAFT SLIP</div><div class="badge-m">${MN[month-1]} ${year}</div></div></div>
                <div class="draft-note">⚠️ DRAFT - This is an unofficial salary slip generated by the employee. Final slip will be issued by HR.</div>
                <div class="emp"><div class="ef"><label>Employee Name</label><span>${user?.name}</span></div><div class="ef"><label>Employee Code</label><span>${employeeInfo?.employeeCode||"-"}</span></div><div class="ef"><label>Designation</label><span>${employeeInfo?.designation||user?.designation||"-"}</span></div><div class="ef"><label>Department</label><span>${employeeInfo?.department?.name||"Company Wide"}</span></div><div class="ef"><label>Pay Period</label><span>${MN[month-1]} ${year}</span></div><div class="ef"><label>Status</label><span>DRAFT</span></div></div>
                <div class="tbls"><table><tr><th class="th-e" colspan="2">Earnings</th></tr><tr><td>Basic Salary</td><td class="r">PKR ${salary.toLocaleString()}</td></tr><tr class="te"><td><b>Gross Salary</b></td><td class="r"><b>PKR ${salary.toLocaleString()}</b></td></tr></table>
                <table><tr><th class="th-d" colspan="2">Deductions</th></tr><tr><td>EOBI (1%)</td><td class="r">PKR ${eobi.toLocaleString()}</td></tr><tr class="td"><td><b>Total Deductions</b></td><td class="r"><b>PKR ${eobi.toLocaleString()}</b></td></tr></table></div>
                <div class="net"><div style="font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:3px">Estimated Net Pay</div><div class="net-a">PKR ${net.toLocaleString()}</div><div style="font-size:11px;opacity:.65">${MN[month-1]} ${year} &bull; DRAFT</div></div>
                <div class="sigs"><div class="sig"><div class="sl"><div style="font-size:10px;color:#6b7280">Employee Signature</div><div style="font-weight:700;margin-top:2px">${user?.name}</div></div></div><div class="sig"><div class="sl"><div style="font-size:10px;color:#6b7280">Authorized By</div><div style="font-weight:700;margin-top:2px">${user?.companyName}</div></div></div></div>
                <div class="foot">DRAFT - Computer-generated. Generated on ${new Date().toLocaleDateString()}. This slip is not official until approved by HR.</div>
                </body></html>`);
                win.document.close();
                setTimeout(() => win.print(), 500);
              }}
              className="w-full border-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50 rounded-xl py-3 text-sm font-semibold transition-all">
              📋 Generate Draft Slip
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">Change Password</h2>
          <p className="text-sm text-gray-500">Choose a strong password at least 6 characters long.</p>
          {(['current', 'newPw', 'confirm'] as const).map(field => {
            const label = field === 'current' ? 'Current Password' : field === 'newPw' ? 'New Password' : 'Confirm New Password';
            return (
              <div key={field}>
                <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                <div className="relative">
                  <input type={showPw[field] ? 'text' : 'password'} value={pwForm[field]}
                    onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })}
                    className="w-full text-gray-900 border border-gray-300 rounded-xl px-4 py-3 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${label.toLowerCase()}`} />
                  <button type="button" onClick={() => setShowPw({ ...showPw, [field]: !showPw[field] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-700 font-medium">
                    {showPw[field] ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            );
          })}
          {pwError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm">{pwError}</div>}
          <button onClick={handleChangePassword} disabled={pwLoading}
            className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all">
            {pwLoading ? 'Updating...' : 'Change Password'}
          </button>
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Account created: {user.id ? 'Active Account' : '—'}</p>
          </div>
        </div>
      )}

      {/* PAYROLL HISTORY TAB */}
      {activeTab === 'payroll' && user.employeeId && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">My Payroll History</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your monthly salary records</p>
            {totalEarnedThisYear > 0 && (
              <div className="mt-3 bg-green-50 rounded-xl px-4 py-2">
                <p className="text-xs text-gray-500">Total Earned This Year</p>
                <p className="text-lg font-bold text-green-600">PKR {totalEarnedThisYear.toLocaleString()}</p>
              </div>
            )}
          </div>
          {payrollLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : payrolls.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-3xl mb-2">💰</p>
              <p className="text-sm">No payroll records yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
               {payrolls.map((p, i) => (
                 <div key={p.id} className={`px-5 py-4 hover:bg-gray-50 transition-colors ${i === 0 ? "bg-blue-50/50" : ""}`}>
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                       <p className="text-sm font-bold text-gray-900">{MONTHS[p.month - 1]} {p.year}</p>
                       {i === 0 && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Latest</span>}
                     </div>
                     <div className="flex items-center gap-2">
                       <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.status === "paid" || p.status === "PAID" ? "bg-green-100 text-green-700" : p.status === "approved" || p.status === "APPROVED" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{p.status}</span>
                       <button onClick={() => {
                         const win = window.open("", "_blank");
                         if (!win) return;
                         const MN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                         win.document.write(`<!DOCTYPE html><html><head><title>Salary Slip</title><style>*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{font-family:Arial,sans-serif;padding:30px;color:#111;font-size:12px}.hdr{display:flex;justify-content:space-between;align-items:center;padding-bottom:15px;border-bottom:4px solid #1e40af;margin-bottom:20px}.co{font-size:22px;font-weight:900;color:#1e40af}.badge{background:#1e40af;color:#fff;padding:10px 18px;border-radius:8px;text-align:center}.badge-m{font-size:16px;font-weight:900}.emp{background:#eff6ff;border-left:5px solid #1e40af;padding:14px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px}.ef label{font-size:10px;color:#6b7280;text-transform:uppercase;display:block}.ef span{font-size:13px;font-weight:700}.tbls{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}table{width:100%;border-collapse:collapse}.th-e{background:#059669;color:#fff;padding:9px 12px;font-size:11px;font-weight:800;text-transform:uppercase}.th-d{background:#dc2626;color:#fff;padding:9px 12px;font-size:11px;font-weight:800;text-transform:uppercase}td{padding:7px 12px;font-size:11px;border-bottom:1px solid #f3f4f6}.r{text-align:right;font-weight:600}.even td{background:#f9fafb}.te td{background:#d1fae5!important;font-weight:800;color:#065f46;border-top:2px solid #059669}.td td{background:#fee2e2!important;font-weight:800;color:#991b1b;border-top:2px solid #dc2626}.net{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;padding:18px;border-radius:10px;text-align:center;margin:16px 0}.net-a{font-size:32px;font-weight:900;margin:6px 0}.sigs{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:50px}.sig{text-align:center}.sl{border-top:1.5px solid #374151;padding-top:6px;margin-top:40px}.foot{text-align:center;margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af}@media print{@page{margin:10mm}}</style></head><body>
         <div class="hdr"><div><div class="co">${user?.companyName||"Company"}</div></div><div class="badge"><div style="font-size:10px;opacity:.8">Salary Slip</div><div class="badge-m">${MN[p.month-1]} ${p.year}</div></div></div>
         <div class="emp"><div class="ef"><label>Employee</label><span>${user?.name}</span></div><div class="ef"><label>Designation</label><span>${user?.designation||"-"}</span></div><div class="ef"><label>Pay Period</label><span>${MN[p.month-1]} ${p.year}</span></div><div class="ef"><label>Status</label><span>${p.status.toUpperCase()}</span></div></div>
         <div class="tbls"><table><tr><th class="th-e" colspan="2">Earnings</th></tr><tr><td>Basic Salary</td><td class="r">PKR ${p.basic.toLocaleString()}</td></tr><tr class="even"><td>Allowances</td><td class="r">PKR ${p.allowances.toLocaleString()}</td></tr><tr class="te"><td><b>Gross Salary</b></td><td class="r"><b>PKR ${(p.basic+p.allowances).toLocaleString()}</b></td></tr></table>
         <table><tr><th class="th-d" colspan="2">Deductions</th></tr><tr><td>Total Deductions</td><td class="r">PKR ${p.deductions.toLocaleString()}</td></tr><tr class="td"><td><b>Total</b></td><td class="r"><b>PKR ${p.deductions.toLocaleString()}</b></td></tr></table></div>
         <div class="net"><div style="font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:3px">Net Pay</div><div class="net-a">PKR ${p.netSalary.toLocaleString()}</div></div>
         <div class="sigs"><div class="sig"><div class="sl"><div style="font-size:10px;color:#6b7280">Employee Signature</div><div style="font-weight:700;margin-top:2px">${user?.name}</div></div></div><div class="sig"><div class="sl"><div style="font-size:10px;color:#6b7280">Authorized By</div><div style="font-weight:700;margin-top:2px">${user?.companyName}</div></div></div></div>
         <div class="foot">Computer-generated salary slip. ${new Date().toLocaleDateString()}</div></body></html>`);
                         win.document.close();
                         setTimeout(() => win.print(), 500);
                       }}
                       className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
                         🖨️ Slip
                       </button>
                     </div>
                   </div>
                   <div className="grid grid-cols-3 gap-2 text-xs">
                     <div className="bg-green-50 rounded-lg p-2 text-center">
                       <p className="text-gray-400">Basic</p>
                       <p className="font-bold text-gray-900">PKR {p.basic.toLocaleString()}</p>
                     </div>
                     <div className="bg-blue-50 rounded-lg p-2 text-center">
                       <p className="text-gray-400">Gross</p>
                       <p className="font-bold text-green-600">PKR {(p.basic + p.allowances).toLocaleString()}</p>
                     </div>
                     <div className="bg-red-50 rounded-lg p-2 text-center">
                       <p className="text-gray-400">Net Pay</p>
                       <p className="font-bold text-blue-700">PKR {p.netSalary.toLocaleString()}</p>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}