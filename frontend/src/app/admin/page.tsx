'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

function AdminLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall('/platform/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      localStorage.setItem('platform_token', data.access_token);
      localStorage.setItem('platform_role', data.admin.role);
      localStorage.setItem('platform_name', data.admin.name);
      localStorage.setItem('platform_email', data.admin.email);
      localStorage.setItem('platform_id', data.admin.id);
      router.replace('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            H
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HRMPro Enterprise</h1>
          <p className="text-gray-500 mt-1 text-sm">Platform Administration</p>
          <div className="mt-2 inline-block bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
            🔐 Super Admin Access Only
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="admin@hrmpro.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Company User?{' '}
          <a href="/" className="text-blue-500 hover:underline">Login here</a>
        </p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
