'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

const ROLE_CARDS = [
  { role: 'COMPANY_ADMIN', label: 'Company Admin', icon: '🏢', description: 'Full company control', color: 'border-purple-200 bg-purple-50 text-purple-700', selectedColor: 'border-purple-500 bg-purple-100' },
  { role: 'HR_MANAGER', label: 'HR Manager', icon: '👔', description: 'Manage HR operations', color: 'border-blue-200 bg-blue-50 text-blue-700', selectedColor: 'border-blue-500 bg-blue-100' },
  { role: 'DEPT_MANAGER', label: 'Department Manager', icon: '👥', description: 'Manage your department', color: 'border-yellow-200 bg-yellow-50 text-yellow-700', selectedColor: 'border-yellow-500 bg-yellow-100' },
  { role: 'EMPLOYEE', label: 'Employee', icon: '👤', description: 'View your information', color: 'border-green-200 bg-green-50 text-green-700', selectedColor: 'border-green-500 bg-green-100' },
];

function getErrorPopup(message: string) {
  if (message.includes('pending approval')) {
    return { icon: '⏳', title: 'Account Pending Approval', message: 'Your company registration is awaiting approval from the platform administrator. Please wait for confirmation.', color: 'yellow' };
  }
  if (message.includes('deactivated')) {
    return { icon: '🚫', title: 'Company Deactivated', message: 'Your company account has been deactivated by the platform administrator. Please contact support.', color: 'red' };
  }
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popup, setPopup] = useState<{ icon: string; title: string; message: string; color: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState('EMPLOYEE');
  const [form, setForm] = useState({ email: '', password: '' });

  // ✅ Show session termination message if redirected here after force logout
  useEffect(() => {
    const sessionMsg = localStorage.getItem('session_message');
    if (sessionMsg) {
      setPopup({ icon: '⚠️', title: 'Session Ended', message: sessionMsg + ' Please contact the platform administrator.', color: 'red' });
      localStorage.removeItem('session_message');
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setPopup(null);
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (data.user.role !== selectedRole) {
        setError(`This account is a ${data.user.role.replace(/_/g, ' ')}. Please select the correct role above.`);
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_role', data.user.role);
      localStorage.setItem('user_name', data.user.name);
      localStorage.setItem('user_email', data.user.email);
      localStorage.setItem('user_id', data.user.id);
      localStorage.setItem('user_companyId', data.user.companyId);
      localStorage.setItem('user_companyName', data.user.companyName || '');
      localStorage.setItem('user_employeeId', data.user.employeeId || '');
      localStorage.setItem('user_departmentId', data.user.departmentId || '');
      localStorage.setItem('user_designation', data.user.designation || '');

      router.replace('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Invalid credentials';
      const popupData = getErrorPopup(msg);
      if (popupData) {
        setPopup(popupData);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  const popupBg: Record<string, string> = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">

        <div className="text-center mb-6">
          <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">H</div>
          <h1 className="text-2xl font-bold text-gray-900">HRMPro Enterprise</h1>
          <p className="text-gray-500 mt-1 text-sm">Select your role and sign in</p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">I am logging in as</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_CARDS.map(card => (
              <button key={card.role} onClick={() => setSelectedRole(card.role)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  selectedRole === card.role ? card.selectedColor + ' border-opacity-100' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                }`}>
                <span className="text-xl">{card.icon}</span>
                <div>
                  <p className={`text-xs font-bold ${selectedRole === card.role ? '' : 'text-gray-700'}`}>{card.label}</p>
                  <p className="text-xs text-gray-400">{card.description}</p>
                </div>
                {selectedRole === card.role && <span className="ml-auto text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ✅ Popup for special errors and session messages */}
        {popup && (
          <div className={`border rounded-xl p-4 mb-4 ${popupBg[popup.color]}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{popup.icon}</span>
              <div>
                <p className="font-bold text-sm mb-1">{popup.title}</p>
                <p className="text-xs leading-relaxed">{popup.message}</p>
              </div>
            </div>
            <button onClick={() => setPopup(null)} className="mt-3 text-xs underline opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              onKeyDown={handleKeyDown} placeholder="you@company.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={handleKeyDown} placeholder="••••••••"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={handleLogin} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors">
            {loading ? 'Signing in...' : `Sign In as ${ROLE_CARDS.find(r => r.role === selectedRole)?.label}`}
          </button>
        </div>

        {/* ✅ Register link — only shown when Company Admin is selected */}
        {selectedRole === 'COMPANY_ADMIN' && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-xl text-center">
            <p className="text-xs text-purple-700">New company? <a href="/register" className="font-semibold hover:underline">Register here</a> and wait for platform approval.</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          Platform Admin? <a href="/admin" className="text-blue-500 hover:underline">Login here</a>
        </p>
      </div>
    </div>
  );
}
