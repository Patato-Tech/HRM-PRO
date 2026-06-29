'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [focused, setFocused] = useState('');
  const [popup, setPopup] = useState<any>(null);
  const [animIn, setAnimIn] = useState(false);
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [activationEmail, setActivationEmail] = useState('');
  const [activationOtp, setActivationOtp] = useState('');
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  useEffect(() => { setTimeout(() => setAnimIn(true), 100); }, []);

  const getErrorPopup = (msg: string) => {
    if (msg.includes('COMPANY_DELETED')) return { title: 'Company Deleted', message: 'Your company account has been permanently deleted.', color: 'red' };
    if (msg.includes('COMPANY_DEACTIVATED') || msg.includes('deactivated')) return { title: 'Account Deactivated', message: 'Your company has been deactivated by the platform administrator.', color: 'red' };
    if (msg.includes('SESSION_INVALIDATED')) return { title: 'Session Expired', message: 'Your password was changed. Please login again.', color: 'yellow' };
    if (msg.includes('pending')) return { title: 'Pending Approval', message: 'Your company is awaiting platform administrator approval.', color: 'yellow' };
    return null;
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError(''); setPopup(null);
    try {
      const data = await apiCall('/auth/login', { method: 'POST', body: JSON.stringify(form) });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_role', data.user.role);
      localStorage.setItem('user_name', (data.user.name || '').trim());
      localStorage.setItem('user_email', data.user.email);
      localStorage.setItem('user_id', data.user.id);
      localStorage.setItem('user_companyId', data.user.companyId);
      localStorage.setItem('user_companyName', data.user.companyName || '');
      localStorage.setItem('user_employeeId', data.user.employeeId || '');
      localStorage.setItem('user_departmentId', data.user.departmentId || '');
      localStorage.setItem('user_departmentName', data.user.departmentName || '');
      localStorage.setItem('user_designation', data.user.designation || '');
      localStorage.setItem('user_customRoleName', data.user.customRoleName || '');
      localStorage.setItem('user_permissions', data.user.permissions ? JSON.stringify(data.user.permissions) : '');
      localStorage.setItem('user_customRoleScope', data.user.customRoleScope || '');
      router.replace('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Invalid credentials';
      const p = getErrorPopup(msg);
      if (p) setPopup(p); else setError(msg);
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) { setForgotError('Please enter a valid email.'); return; }
    setForgotLoading(true); setForgotError('');
    try {
      await apiCall('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: forgotEmail }) });
      setOtpSent(true);
      setForgotSuccess('OTP sent to your email! Check your inbox.');
      setShowForgotPw(false);
      setShowResetPw(true);
    } catch (e) { setForgotError('Failed. Please check your email.'); }
    finally { setForgotLoading(false); }
  };
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) { setForgotError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmNewPassword) { setForgotError('Passwords do not match.'); return; }
    setForgotLoading(true); setForgotError('');
    try {
      await apiCall('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email: forgotEmail, otp, newPassword }) });
      setShowResetPw(false);
      setForgotSuccess('Password reset! You can now login.');
    } catch (e) { setForgotError('Failed to reset password. Token may be expired.'); }
    finally { setForgotLoading(false); }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50">
      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-24px) scale(1.04)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(18px) scale(0.97)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:1} 100%{transform:scale(2);opacity:0} }
        .orb-a { animation: floatA 7s ease-in-out infinite; }
        .orb-b { animation: floatB 9s ease-in-out infinite; }
        .slide-in { animation: slideIn 0.7s ease forwards; }
        .slide-right { animation: slideRight 0.7s ease forwards; }
        .input-focus { transition: all 0.2s ease; }
        .input-focus:focus { transform: scale(1.01); }
        .btn-hover { transition: all 0.2s ease; }
        .btn-hover:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.5) !important; }
        .btn-hover:active:not(:disabled) { transform: translateY(0); }
        .feature-card { transition: all 0.2s ease; }
        .feature-card:hover { transform: translateX(4px); background: rgba(255,255,255,0.2) !important; }
        .stat-card { transition: all 0.2s ease; }
        .stat-card:hover { transform: translateY(-3px); background: rgba(255,255,255,0.2) !important; }
      `}</style>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[58%] relative flex-col overflow-hidden"
        style={{background:'linear-gradient(145deg,#1e3a8a 0%,#1d4ed8 45%,#2563eb 75%,#60a5fa 100%)'}}>

        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb-a absolute w-80 h-80 rounded-full"
            style={{background:'radial-gradient(circle,rgba(255,255,255,0.15),transparent)',top:'-4rem',right:'-4rem'}} />
          <div className="orb-b absolute w-56 h-56 rounded-full"
            style={{background:'radial-gradient(circle,rgba(255,255,255,0.1),transparent)',bottom:'3rem',left:'-2rem'}} />
          <div className="orb-a absolute w-36 h-36 rounded-full"
            style={{background:'radial-gradient(circle,rgba(255,255,255,0.08),transparent)',top:'45%',left:'55%',animationDelay:'3s'}} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5"
            style={{backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)',backgroundSize:'40px 40px'}} />
        </div>

        <div className={`relative z-10 flex flex-col h-full p-14 ${animIn ? 'slide-in' : 'opacity-0'}`}>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-blue-700 font-black text-xl">H</span>
            </div>
            <div>
              <p className="text-white font-black text-xl leading-none tracking-tight">HRMPro</p>
              <p className="text-blue-200 text-xs font-medium mt-0.5">Enterprise Edition</p>
            </div>
          </div>

          {/* Main heading */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em] mb-5">Human Resource Management</p>
            <h1 className="text-5xl font-black text-white leading-[1.05] mb-6 tracking-tight">
              Your entire<br />workforce,<br /><span className="text-blue-200">one platform.</span>
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed mb-10 max-w-xs opacity-80">
              From hire to retire. Manage attendance, payroll, leaves, and performance in one beautifully crafted platform.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                {value:'10K+',label:'Employees managed'},
                {value:'500+',label:'Companies onboarded'},
                {value:'99.9%',label:'Uptime guaranteed'},
              ].map((s,i) => (
                <div key={i} className="stat-card rounded-2xl p-4 border border-white border-opacity-20 cursor-default"
                  style={{background:'rgba(255,255,255,0.12)',backdropFilter:'blur(10px)'}}>
                  <p className="text-white font-black text-2xl leading-none">{s.value}</p>
                  <p className="text-blue-200 text-xs mt-1.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-2">
              {[
                {icon:'👥',label:'Employee Management'},
                {icon:'📅',label:'Attendance Tracking'},
                {icon:'💰',label:'Payroll Processing'},
                {icon:'📊',label:'Advanced Analytics'},
                {icon:'🌿',label:'Leave Management'},
                {icon:'📋',label:'Custom Reports'},
              ].map((f,i) => (
                <div key={i} className="feature-card flex items-center gap-2.5 rounded-xl px-3 py-2.5 border border-white border-opacity-10 cursor-default"
                  style={{background:'rgba(255,255,255,0.1)'}}>
                  <span className="text-base">{f.icon}</span>
                  <span className="text-white text-xs font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-blue-300 text-xs opacity-50">© 2026 HRMPro Enterprise · All rights reserved</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-8 min-h-screen bg-gray-50">
        <div className={`w-full max-w-[400px] ${animIn ? 'slide-right' : 'opacity-0'}`}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">H</span>
            </div>
            <span className="text-gray-900 font-black text-lg">HRMPro Enterprise</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-1.5 tracking-tight">Welcome back</h2>
            <p className="text-gray-400 text-sm">Sign in to access your workspace</p>
          </div>

          {popup && (
            <div className={`rounded-2xl p-4 mb-5 border ${popup.color === 'red' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
              <p className="font-bold text-sm">{popup.title}</p>
              <p className="text-xs mt-1 opacity-80">{popup.message}</p>
              <button onClick={() => setPopup(null)} className="text-xs underline opacity-60 hover:opacity-100 mt-2">Dismiss</button>
            </div>
          )}

          {forgotSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 mb-5 text-sm">{forgotSuccess}</div>}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-5 text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span><span>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 space-y-5" style={{boxShadow:'0 4px 40px rgba(0,0,0,0.06)'}}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                onKeyDown={handleKeyDown}
                placeholder="Enter email address"
                className={`input-focus w-full rounded-2xl px-4 py-3.5 text-sm text-gray-900 outline-none transition-all duration-200 ${focused === 'email' ? 'border-2 border-blue-500 bg-blue-50 shadow-sm' : 'border-2 border-gray-100 bg-gray-50'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter password"
                  className={`input-focus w-full rounded-2xl px-4 py-3.5 pr-12 text-sm text-gray-900 outline-none transition-all duration-200 ${focused === 'password' ? 'border-2 border-blue-500 bg-blue-50 shadow-sm' : 'border-2 border-gray-100 bg-gray-50'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors text-lg">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="text-right -mt-2"><button type="button" onClick={() => { setShowForgotPw(true); setForgotError(""); setForgotEmail(""); }} className="text-xs text-blue-500 hover:text-blue-700 font-medium hover:underline">Forgot password?</button></div>
            <button onClick={handleLogin} disabled={loading}
              className="btn-hover w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
              style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',boxShadow:'0 4px 15px rgba(59,130,246,0.4)'}}>
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

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">New company? <a href="/register" className="text-blue-600 font-semibold hover:underline">Register here</a></p>
            <p className="text-xs text-gray-400">Platform Admin? <a href="/admin" className="text-blue-500 hover:underline">Login here</a></p>
          </div>
        </div>
      </div>
      {showForgotPw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900">Forgot Password</h3>
              <button onClick={() => setShowForgotPw(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">x</button>
            </div>
            <p className="text-sm text-gray-500 mb-5">Enter your email to receive a 6-digit OTP for password reset.</p>
            {forgotError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{forgotError}</div>}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Enter your email" className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50" />
            </div>
            {otpSent && (
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50 text-center text-2xl font-bold tracking-widest" />
                <p className="text-xs text-gray-400 mt-1 text-center">Check your email inbox</p>
              </div>
            )}
            {otpSent && (
              <div className="mb-5 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50" />
                </div>
                <button onClick={handleResetPassword} disabled={forgotLoading || !otp || !newPassword || newPassword !== confirmNewPassword} className="w-full text-white py-3 rounded-2xl text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#059669,#10b981)"}}>{forgotLoading ? "Resetting..." : "Reset Password"}</button>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowForgotPw(false)} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-medium">Cancel</button>
              <button onClick={handleForgotPassword} disabled={forgotLoading} className="flex-1 text-white py-3 rounded-2xl text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                {forgotLoading ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showActivation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔐</div>
              <h3 className="text-2xl font-black text-gray-900">Activate Your Account</h3>
              <p className="text-sm text-gray-500 mt-2">Enter the 6-digit OTP sent to your email to activate your account.</p>
              <p className="text-sm font-semibold text-blue-600 mt-1">{activationEmail}</p>
            </div>
            {activationError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{activationError}</div>}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Activation OTP</label>
              <input type="text" value={activationOtp} onChange={e => setActivationOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50 text-center text-2xl font-bold tracking-widest" />
              <p className="text-xs text-gray-400 mt-1 text-center">Check your welcome email for the OTP</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowActivation(false)} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-medium">Cancel</button>
              <button onClick={handleActivateAccount} disabled={activationLoading} className="flex-1 text-white py-3 rounded-2xl text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>{activationLoading ? "Activating..." : "Activate Account"}</button>
            </div>
          </div>
        </div>
      )}
      {showResetPw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900">Reset Password</h3>
              <button onClick={() => setShowResetPw(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">x</button>
            </div>
            {forgotError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{forgotError}</div>}
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password (8+ chars)" className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50" />
                {newPassword && confirmNewPassword && <p className={"text-xs mt-1 font-medium " + (newPassword === confirmNewPassword ? "text-green-600" : "text-red-500")}>{newPassword === confirmNewPassword ? "Passwords match" : "Passwords do not match"}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowResetPw(false)} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-medium">Cancel</button>
              <button onClick={handleResetPassword} disabled={forgotLoading} className="flex-1 text-white py-3 rounded-2xl text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#059669,#10b981)"}}>
                {forgotLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
