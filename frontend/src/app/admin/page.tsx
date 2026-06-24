'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

function AdminLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const [focused, setFocused] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => { setTimeout(() => setAnimIn(true), 100); }, []);

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError('Please enter your credentials.'); return; }
    setLoading(true); setError('');
    try {
      const data = await apiCall('/platform/auth/login', { method: 'POST', body: JSON.stringify({ email: form.email, password: form.password }) });
      localStorage.setItem('platform_token', data.access_token);
      localStorage.setItem('platform_role', data.admin?.role || 'PLATFORM_ADMIN');
      localStorage.setItem('platform_name', data.admin?.name || '');
      localStorage.setItem('platform_email', data.admin?.email || '');
      localStorage.setItem('platform_id', data.admin?.id || '');
      router.replace('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <div className="min-h-screen flex overflow-hidden">
      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(15px)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        .orb-a { animation: floatA 8s ease-in-out infinite; }
        .orb-b { animation: floatB 10s ease-in-out infinite; }
        .slide-in { animation: slideIn 0.7s ease forwards; }
        .slide-right { animation: slideRight 0.7s ease forwards; }
        .btn-hover { transition: all 0.2s ease; }
        .btn-hover:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(15,23,42,0.5) !important; }
        .btn-hover:active:not(:disabled) { transform: translateY(0); }
        .feature-item { transition: all 0.2s ease; }
        .feature-item:hover { transform: translateX(5px); }
      `}</style>

      {/* LEFT PANEL - Dark theme for admin */}
      <div className="hidden lg:flex lg:w-[58%] relative flex-col overflow-hidden"
        style={{background:'linear-gradient(145deg,#020617 0%,#0f172a 40%,#1e293b 75%,#334155 100%)'}}>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb-a absolute w-96 h-96 rounded-full"
            style={{background:'radial-gradient(circle,rgba(59,130,246,0.15),transparent)',top:'-5rem',right:'-5rem'}} />
          <div className="orb-b absolute w-64 h-64 rounded-full"
            style={{background:'radial-gradient(circle,rgba(99,102,241,0.1),transparent)',bottom:'3rem',left:'-3rem'}} />
          <div className="orb-a absolute w-40 h-40 rounded-full"
            style={{background:'radial-gradient(circle,rgba(59,130,246,0.08),transparent)',top:'40%',left:'50%',animationDelay:'4s'}} />
          <div className="absolute inset-0 opacity-5"
            style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)',backgroundSize:'50px 50px'}} />
          {/* Blue accent line */}
          <div className="absolute top-0 left-0 w-1 h-full" style={{background:'linear-gradient(to bottom,transparent,#3b82f6,transparent)'}} />
        </div>

        <div className={`relative z-10 flex flex-col h-full p-14 ${animIn ? 'slide-in' : 'opacity-0'}`}>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border border-blue-500 border-opacity-30"
              style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)'}}>
              <span className="text-white font-black text-xl">H</span>
            </div>
            <div>
              <p className="text-white font-black text-xl leading-none tracking-tight">HRMPro</p>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Enterprise Edition</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 w-fit border border-blue-500 border-opacity-30"
              style={{background:'rgba(59,130,246,0.1)'}}>
              <div className="w-2 h-2 bg-blue-400 rounded-full" style={{animation:'pulse 2s infinite'}} />
              <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Platform Administration</span>
            </div>

            <h1 className="text-5xl font-black text-white leading-[1.05] mb-6 tracking-tight">
              Super Admin<br /><span className="text-blue-400">Control Center</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-12 max-w-sm">
              Review registrations, manage company accounts, edit details and reset passwords from one secure panel.
            </p>

            {/* Features list */}
            <div className="space-y-4">
              {[
                {icon:'✅',label:'Approve company registrations',desc:'Review and activate new companies'},
                {icon:'⛔',label:'Deactivate companies',desc:'Suspend or reactivate company accounts'},
                {icon:'✏️',label:'Edit company details',desc:'Update name, industry and address'},
                {icon:'🔑',label:'Reset admin passwords',desc:'Reset company admin credentials'},
              ].map((f,i) => (
                <div key={i} className="feature-item flex items-start gap-4 cursor-default">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}>
                    <span className="text-lg">{f.icon}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{f.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-xs">© 2026 HRMPro Enterprise · Restricted Access Only</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-8 min-h-screen"
        style={{background:'#0f172a'}}>
        <div className={`w-full max-w-[400px] ${animIn ? 'slide-right' : 'opacity-0'}`}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)'}}>
              <span className="text-white font-black text-sm">H</span>
            </div>
            <span className="text-white font-black text-lg">HRMPro Enterprise</span>
          </div>

          {/* Restricted badge */}
          <div className="inline-flex items-center gap-2 bg-red-900 bg-opacity-50 border border-red-700 border-opacity-50 rounded-full px-3 py-1.5 mb-6">
            <span className="text-red-400 text-xs">🔐</span>
            <span className="text-red-300 text-xs font-semibold">Super Admin Access Only</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-1.5 tracking-tight">Platform Login</h2>
            <p className="text-slate-400 text-sm">Enter your administrator credentials</p>
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-40 border border-red-700 border-opacity-50 text-red-300 rounded-2xl p-4 mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <div className="rounded-3xl p-8 space-y-5" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Admin Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                onKeyDown={handleKeyDown}
                placeholder="Enter admin email"
                className="w-full rounded-2xl px-4 py-3.5 text-sm text-white outline-none transition-all duration-200"
                style={{
                  background: focused === 'email' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                  border: focused === 'email' ? '2px solid rgba(59,130,246,0.6)' : '2px solid rgba(255,255,255,0.08)'
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter password"
                  className="w-full rounded-2xl px-4 py-3.5 pr-12 text-sm text-white outline-none transition-all duration-200"
                  style={{
                    background: focused === 'password' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                    border: focused === 'password' ? '2px solid rgba(59,130,246,0.6)' : '2px solid rgba(255,255,255,0.08)'
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors text-lg">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button onClick={handleLogin} disabled={loading}
              className="btn-hover w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{background:'linear-gradient(135deg,#1e293b,#334155)',boxShadow:'0 4px 15px rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            Company User? <a href="/" className="text-blue-400 hover:underline font-medium">Login here</a>
          </p>
        </div>
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


