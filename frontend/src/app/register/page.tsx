'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    companyName: '', industry: '', address: '',
    adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
  });

  const handleSubmit = async () => {
    setError('');
    if (!form.companyName || !form.adminName || !form.adminEmail || !form.adminPassword) {
      setError('Please fill all required fields'); return;
    }
    if (form.adminPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.adminPassword !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await apiCall('/platform/register', {
        method: 'POST',
        body: JSON.stringify({
          companyName: form.companyName, industry: form.industry, address: form.address,
          adminName: form.adminName, adminEmail: form.adminEmail, adminPassword: form.adminPassword,
        }),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h1>
          <p className="text-gray-500 text-sm mb-4">Your company registration has been submitted. The platform administrator will review and activate your account.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-700 text-sm font-medium">⚠️ Your account is pending approval</p>
            <p className="text-yellow-600 text-xs mt-1">You will be able to login once the administrator approves your request.</p>
          </div>
          <button onClick={() => router.push('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">H</div>
          <h1 className="text-2xl font-bold text-gray-900">Register Your Company</h1>
          <p className="text-gray-500 mt-1 text-sm">Create your HRMPro Enterprise account</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">Company Information</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input type="text" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Acme Corporation"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input type="text" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}
                    placeholder="Technology"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Lahore, Pakistan"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">Your Account (Company Admin)</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })}
                  placeholder="admin@acme.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input type="password" value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm">
            {loading ? 'Submitting...' : 'Submit Registration'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{' '}
          <a href="/" className="text-blue-500 hover:underline">Login here</a>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
