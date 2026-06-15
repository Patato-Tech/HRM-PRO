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
                <div key={p.id} className={`px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${i === 0 ? 'bg-blue-50/50' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{MONTHS[p.month - 1]} {p.year}</p>
                      {i === 0 && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Latest</span>}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>Basic: PKR {p.basic.toLocaleString()}</span>
                      <span className="text-green-500">+{p.allowances.toLocaleString()}</span>
                      <span className="text-red-400">-{p.deductions.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">PKR {(p.netSalary || p.basic + p.allowances - p.deductions).toLocaleString()}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${p.status === 'PAID' ? 'bg-green-100 text-green-700' : p.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
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
  );
}
