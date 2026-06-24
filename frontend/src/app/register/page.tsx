'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [approved, setApproved] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [animIn, setAnimIn] = useState(false);
  const [focused, setFocused] = useState('');
  const [step, setStep] = useState(1);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [form, setForm] = useState({
    companyName: '', industry: '', address: '',
    adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
  });

  useEffect(() => { setTimeout(() => setAnimIn(true), 100); }, []);

  useEffect(() => {
    if (submitted && registeredEmail && !approved) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:5001/auth/company-status?email=${encodeURIComponent(registeredEmail)}`);
          const data = await res.json();
          if (data.status === 'active') { setApproved(true); if (pollingRef.current) clearInterval(pollingRef.current); }
        } catch {}
      }, 30000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [submitted, registeredEmail, approved]);

  const handleSubmit = async () => {
    if (!form.companyName || !form.adminName || !form.adminEmail || !form.adminPassword) { setError('Please fill all required fields.'); return; }
    if (form.adminPassword !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.adminPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          companyName: form.companyName, industry: form.industry, address: form.address,
          name: form.adminName, email: form.adminEmail, password: form.adminPassword,
          role: 'COMPANY_ADMIN',
        }),
      });
      setSubmitted(true);
      setRegisteredEmail(form.adminEmail);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inputStyle = (name: string) => ({
    background: focused === name ? 'rgba(59,130,246,0.05)' : '#f8fafc',
    border: focused === name ? '2px solid #3b82f6' : '2px solid #f1f5f9',
    transition: 'all 0.2s ease',
  });

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(135deg,#f0f9ff,#e0f2fe,#f0f9ff)'}}>
        <style>{`
          @keyframes scaleIn { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          .scale-in { animation: scaleIn 0.5s ease forwards; }
          .bounce { animation: bounce 2s ease-in-out infinite; }
        `}</style>
        <div className="bg-white rounded-3xl w-full max-w-md p-10 text-center scale-in" style={{boxShadow:'0 20px 60px rgba(0,0,0,0.1)'}}>
          {approved ? (
            <>
              <div className="bounce w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🎉</div>
              <h1 className="text-2xl font-black text-gray-900 mb-3">Company Approved!</h1>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Your company account has been approved by the platform administrator. You can now log in to your dashboard.</p>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                <p className="text-green-700 text-sm font-semibold">✅ Account is now active</p>
                <p className="text-green-600 text-xs mt-1">Click below to access your dashboard.</p>
              </div>
              <button onClick={() => router.push('/')}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                style={{background:'linear-gradient(135deg,#059669,#10b981)',boxShadow:'0 4px 15px rgba(16,185,129,0.4)'}}>
                Go to Login →
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">⏳</div>
              <h1 className="text-2xl font-black text-gray-900 mb-3">Registration Submitted!</h1>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">Your registration is under review. The platform administrator will activate your account shortly.</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
                <p className="text-yellow-700 text-sm font-semibold">⏳ Pending approval</p>
                <p className="text-yellow-600 text-xs mt-1">This page auto-updates every 30 seconds.</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mb-6">
                <svg className="animate-spin h-3 w-3 text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Checking approval status...
              </div>
              <button onClick={() => router.push('/')}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',boxShadow:'0 4px 15px rgba(59,130,246,0.4)'}}>
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

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
        .btn-hover:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.5) !important; }
        .step-btn { transition: all 0.2s ease; }
        .step-btn:hover { transform: translateX(3px); }
      `}</style>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col overflow-hidden"
        style={{background:'linear-gradient(145deg,#1e3a8a 0%,#1d4ed8 50%,#2563eb 80%,#60a5fa 100%)'}}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb-a absolute w-80 h-80 rounded-full"
            style={{background:'radial-gradient(circle,rgba(255,255,255,0.12),transparent)',top:'-4rem',right:'-4rem'}} />
          <div className="orb-b absolute w-56 h-56 rounded-full"
            style={{background:'radial-gradient(circle,rgba(255,255,255,0.08),transparent)',bottom:'4rem',left:'-2rem'}} />
          <div className="absolute inset-0 opacity-5"
            style={{backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)',backgroundSize:'40px 40px'}} />
        </div>
        <div className={`relative z-10 flex flex-col h-full p-12 ${animIn ? 'slide-in' : 'opacity-0'}`}>
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-blue-700 font-black text-lg">H</span>
            </div>
            <div>
              <p className="text-white font-black text-lg leading-none">HRMPro</p>
              <p className="text-blue-200 text-xs mt-0.5">Enterprise Edition</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-10">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-5">Company Registration</p>
            <h1 className="text-4xl font-black text-white leading-tight mb-5 tracking-tight">
              Start your HR<br />journey<br /><span className="text-blue-200">today.</span>
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed mb-10 opacity-80 max-w-xs">
              Join companies managing their workforce smarter with HRMPro Enterprise.
            </p>

            {/* Steps */}
            <div className="space-y-4 mb-10">
              {[
                {num:'01',title:'Company Details',desc:'Tell us about your organization'},
                {num:'02',title:'Admin Account',desc:'Create your administrator login'},
                {num:'03',title:'Get Approved',desc:'Platform admin reviews and activates'},
              ].map((s,i) => (
                <div key={i} className="step-btn flex items-center gap-4 cursor-default">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                    style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)'}}>
                    <span className="text-white">{s.num}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{s.title}</p>
                    <p className="text-blue-200 text-xs opacity-70">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-2">
              {['Free setup','Instant access','Secure data','24/7 support'].map((b,i) => (
                <div key={i} className="flex items-center gap-2 text-blue-100 text-xs">
                  <span className="text-green-300">✓</span>{b}
                </div>
              ))}
            </div>
          </div>

          <p className="text-blue-300 text-xs opacity-50">© 2026 HRMPro Enterprise</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[58%] flex items-center justify-center bg-gray-50 p-8 min-h-screen overflow-y-auto">
        <div className={`w-full max-w-[500px] py-8 ${animIn ? 'slide-right' : 'opacity-0'}`}>

          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">H</span>
            </div>
            <span className="text-gray-900 font-black text-lg">HRMPro Enterprise</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-1.5 tracking-tight">Register your company</h2>
            <p className="text-gray-400 text-sm">Fill in the details below to get started</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 space-y-6" style={{boxShadow:'0 4px 40px rgba(0,0,0,0.06)'}}>
            {/* Company section */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xs font-black">01</span>
                </div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Company Information</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
                  <input type="text" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})}
                    onFocus={() => setFocused('companyName')} onBlur={() => setFocused('')}
                    placeholder="Enter company name"
                    className="w-full rounded-2xl px-4 py-3.5 text-sm text-gray-900 outline-none"
                    style={inputStyle('companyName')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                    <input type="text" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})}
                      onFocus={() => setFocused('industry')} onBlur={() => setFocused('')}
                      placeholder="Enter industry"
                      className="w-full rounded-2xl px-4 py-3 text-sm text-gray-900 outline-none"
                      style={inputStyle('industry')} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                      onFocus={() => setFocused('address')} onBlur={() => setFocused('')}
                      placeholder="Enter address"
                      className="w-full rounded-2xl px-4 py-3 text-sm text-gray-900 outline-none"
                      style={inputStyle('address')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Admin section */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xs font-black">02</span>
                </div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Admin Account</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input type="text" value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})}
                    onFocus={() => setFocused('adminName')} onBlur={() => setFocused('')}
                    placeholder="Enter your full name"
                    className="w-full rounded-2xl px-4 py-3.5 text-sm text-gray-900 outline-none"
                    style={inputStyle('adminName')} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <input type="email" value={form.adminEmail} onChange={e => setForm({...form, adminEmail: e.target.value})}
                    onFocus={() => setFocused('adminEmail')} onBlur={() => setFocused('')}
                    placeholder="Enter email address"
                    className="w-full rounded-2xl px-4 py-3.5 text-sm text-gray-900 outline-none"
                    style={inputStyle('adminEmail')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                    <input type="password" value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})}
                      onFocus={() => setFocused('adminPassword')} onBlur={() => setFocused('')}
                      placeholder="Enter password"
                      className="w-full rounded-2xl px-4 py-3 text-sm text-gray-900 outline-none"
                      style={inputStyle('adminPassword')} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm *</label>
                    <input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})}
                      onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused('')}
                      placeholder="Confirm password"
                      className="w-full rounded-2xl px-4 py-3 text-sm text-gray-900 outline-none"
                      style={inputStyle('confirmPassword')} />
                  </div>
                </div>
                {form.adminPassword && form.confirmPassword && (
                  <p className={`text-xs font-medium ${form.adminPassword === form.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                    {form.adminPassword === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="btn-hover w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
              style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',boxShadow:'0 4px 15px rgba(59,130,246,0.4)'}}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Submitting...
                </span>
              ) : 'Submit Registration →'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Already have an account? <a href="/" className="text-blue-600 font-semibold hover:underline">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
