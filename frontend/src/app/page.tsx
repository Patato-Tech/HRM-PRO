'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

function getErrorPopup(message: string) {
  if (message.includes('pending approval')) {
    return { icon: '⏳', title: 'Account Pending Approval', message: 'Your company registration is awaiting approval from the platform administrator. Please wait for confirmation.', color: 'yellow' };
  }
  if (message.includes('COMPANY_DELETED') || message.includes('removed from the platform')) {
    return { icon: '🗑️', title: 'Company Account Deleted', message: 'Your company account has been permanently deleted. Please contact support.', color: 'red' };
  }
  if (message.includes('COMPANY_DEACTIVATED') || message.includes('deactivated')) {
    return { icon: '🚫', title: 'Company Deactivated', message: 'Your company account has been deactivated by the platform administrator. Please contact support.', color: 'red' };
  }
  if (message.includes('Invalid credentials')) {
    return { icon: '🔑', title: 'Invalid Credentials', message: 'Your email or password is incorrect. Please try again or contact your administrator.', color: 'red' };
  }
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [popup, setPopup] = useState<{ icon: string; title: string; message: string; color: string } | null>(null);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    const sessionMsg = localStorage.getItem('session_message');
    if (sessionMsg) {
      setPopup({ icon: '⚠️', title: 'Session Ended', message: sessionMsg + ' Please contact the platform administrator.', color: 'red' });
      localStorage.removeItem('session_message');
    }
  }, []);

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    setPopup(null);
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });

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
      localStorage.setItem('user_customRoleName', data.user.customRoleName || '');
      localStorage.setItem('user_permissions', data.user.permissions ? JSON.stringify(data.user.permissions) : '');
      localStorage.setItem('user_customRoleScope', data.user.customRoleScope || '');

      router.replace('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Invalid credentials';
      const popupData = getErrorPopup(msg);
      if (popupData) setPopup(popupData);
      else setError(msg);
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">H</div>
          <h1 className="text-2xl font-bold text-gray-900">HRMPro Enterprise</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Session/Error Popup */}
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

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="you@company.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        {/* Register + Admin links */}
        <div className="mt-6 space-y-2 text-center">
          <p className="text-xs text-gray-500">
            New company? <a href="/register" className="text-blue-600 font-semibold hover:underline">Register here</a>
          </p>
          <p className="text-xs text-gray-400">
            Platform Admin? <a href="/admin" className="text-blue-500 hover:underline">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
