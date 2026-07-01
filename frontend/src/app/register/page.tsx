'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  "Pakistan": ["Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Quetta","Sialkot","Gujranwala","Hyderabad","Abbottabad","Bahawalpur","Sargodha","Sahiwal","Other"],
  "United States": ["New York","Los Angeles","Chicago","Houston","Phoenix","Dallas","San Diego","San Jose","Austin","Other"],
  "United Kingdom": ["London","Birmingham","Manchester","Leeds","Glasgow","Liverpool","Bristol","Sheffield","Other"],
  "United Arab Emirates": ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Other"],
  "Saudi Arabia": ["Riyadh","Jeddah","Mecca","Medina","Dammam","Khobar","Tabuk","Other"],
  "India": ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Other"],
  "Canada": ["Toronto","Montreal","Vancouver","Calgary","Edmonton","Ottawa","Other"],
  "Australia": ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Other"],
};

const validatePassword = (pw: string) => {
  const errors: string[] = [];
  if (pw.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(pw)) errors.push("one uppercase letter");
  if (!/[a-z]/.test(pw)) errors.push("one lowercase letter");
  if (!/[0-9]/.test(pw)) errors.push("one number");
  if (!/[@#$!%*?&]/.test(pw)) errors.push("one special character");
  return errors;
};

const getPasswordStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[@#$!%*?&]/.test(pw)) score++;
  if (score <= 2) return { label: "Weak", color: "#ef4444", width: "25%" };
  if (score <= 3) return { label: "Fair", color: "#f59e0b", width: "50%" };
  if (score <= 4) return { label: "Good", color: "#3b82f6", width: "75%" };
  return { label: "Strong", color: "#10b981", width: "100%" };
};

const INDUSTRIES = ["Technology","Finance","Healthcare","Education","Manufacturing","Retail","Construction","Transportation","Hospitality","Media","Real Estate","Agriculture","Other"];
const COUNTRIES = ["Pakistan","United Arab Emirates","Saudi Arabia","United Kingdom","United States","Canada","Australia","Other"];

function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [approved, setApproved] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [animIn, setAnimIn] = useState(false);
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [customIndustry, setCustomIndustry] = useState("");
  const [customDesignation, setCustomDesignation] = useState("");
  const [showCustomDesignation, setShowCustomDesignation] = useState(false);
  const [customCountry, setCustomCountry] = useState("");
  const [form, setForm] = useState({
    companyName: '', industry: '', companySize: '', companyPhone: '',
    address: '', city: '', country: 'Pakistan', website: '', regNumber: '',
    adminName: '', adminEmail: '', adminPhone: '', adminDesignation: '',
    adminCnic: '', adminPassword: '', confirmPassword: '',
  });

  useEffect(() => { setTimeout(() => setAnimIn(true), 100); }, []);

  useEffect(() => {
    if (submitted && registeredEmail && !approved) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001")}/auth/company-status?email=${encodeURIComponent(registeredEmail)}`);
          const data = await res.json();
          if (data.status === 'active') { setApproved(true); if (pollingRef.current) clearInterval(pollingRef.current); }
        } catch {}
      }, 5000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [submitted, registeredEmail, approved]);

  const validateField = (name: string, value: string) => {
    let err = "";
    if (name === "companyName" && !value.trim()) err = "Company name is required";
    if (name === "adminName" && !value.trim()) err = "Full name is required";
    if (name === "adminEmail") {
      if (!value.trim()) err = "Email is required";
      else if (!value.includes("@")) err = "Valid email required";
    }
    if (name === "adminPhone" && value && !/^03[0-9]{9}$/.test(value.replace(/[-\s]/g, ""))) err = "Format: 03XXXXXXXXX";
    if (name === "companyPhone" && value && !/^03[0-9]{9}$/.test(value.replace(/[-\s]/g, ""))) err = "Format: 03XXXXXXXXX";
    if (name === "adminCnic" && value && !/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(value)) err = "Format: XXXXX-XXXXXXX-X";
    if (name === "website" && value && !value.includes(".")) err = "Enter a valid website URL";
    if (name === "adminPassword" && value) {
      const pwErrors = validatePassword(value);
      if (pwErrors.length > 0) err = "Must have: " + pwErrors.join(", ");
    }
    if (name === "confirmPassword" && value && value !== form.adminPassword) err = "Passwords do not match";
    setFieldErrors(prev => ({ ...prev, [name]: err }));
  };

  const validateStep1 = () => {
    const errors: string[] = [];
    if (!form.companyName.trim()) errors.push("Company name is required.");
    if (form.companyPhone && !/^03[0-9]{9}$/.test(form.companyPhone.replace(/[-\s]/g, ""))) errors.push("Invalid company phone format.");
    return errors;
  };

  const validateStep2 = () => {
    const errors: string[] = [];
    if (!form.adminName.trim()) errors.push("Full name is required.");
    if (!form.adminEmail.trim() || !form.adminEmail.includes("@")) errors.push("Valid email is required.");
    if (!form.adminPassword) errors.push("Password is required.");
    else {
      const pwErrors = validatePassword(form.adminPassword);
      if (pwErrors.length > 0) errors.push("Password must have: " + pwErrors.join(", "));
    }
    if (form.adminPassword !== form.confirmPassword) errors.push("Passwords do not match.");
    return errors;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      const errors = validateStep1();
      if (errors.length > 0) { setError(errors.join(" | ")); return; }
    }
    if (step === 2) {
      const errors = validateStep2();
      if (errors.length > 0) { setError(errors.join(" | ")); return; }
    }
    setStep(step + 1);
  };

  const sendEmailOtp = async () => {
    if (!form.adminEmail.includes('@')) { setOtpError('Enter a valid email first'); return; }
    setOtpLoading(true); setOtpError('');
    try {
      await apiCall('/auth/send-verification-otp', { method: 'POST', body: JSON.stringify({ email: form.adminEmail }) });
      setEmailOtpSent(true);
    } catch (e: any) { setOtpError(e?.message || 'Failed to send OTP'); }
    finally { setOtpLoading(false); }
  };
  const verifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) { setOtpError('Enter the 6-digit OTP'); return; }
    setOtpLoading(true); setOtpError('');
    try {
      await apiCall('/auth/verify-email-otp', { method: 'POST', body: JSON.stringify({ email: form.adminEmail, otp: emailOtp }) });
      setEmailVerified(true);
      setEmailOtpSent(false);
      setOtpError('');
    } catch (e: any) { setOtpError('Invalid or expired OTP'); }
    finally { setOtpLoading(false); }
  };
  const handleSubmit = async () => {
    if (!agreed) { setError("Please agree to the terms and conditions."); return; }
    setLoading(true); setError('');
    try {
      await apiCall('/platform/register', {
        method: 'POST',
        body: JSON.stringify({
          companyName: form.companyName, industry: form.industry, address: form.address,
          city: form.city, country: form.country, companyPhone: form.companyPhone,
          website: form.website, companySize: form.companySize, regNumber: form.regNumber,
          adminName: form.adminName, adminEmail: form.adminEmail, adminPassword: form.adminPassword, adminPhone: form.adminPhone, adminDesignation: form.adminDesignation, adminCnic: form.adminCnic,
        }),
      });
      setSubmitted(true);
      setRegisteredEmail(form.adminEmail);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inputClass = (name: string) => `w-full rounded-2xl px-4 py-3 text-sm text-gray-900 outline-none transition-all ${fieldErrors[name] ? 'border-2 border-red-400 bg-red-50' : 'border-2 border-gray-100 bg-gray-50 focus:border-blue-500 focus:bg-white'}`;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)'}}>
        <div className="bg-white rounded-3xl w-full max-w-md p-10 text-center" style={{boxShadow:'0 20px 60px rgba(0,0,0,0.1)'}}>
          {approved ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🎉</div>
              <h1 className="text-2xl font-black text-gray-900 mb-3">Company Approved!</h1>
              <p className="text-gray-500 text-sm mb-6">Your account has been approved. You can now log in.</p>
              <button onClick={() => router.push('/')} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white" style={{background:'linear-gradient(135deg,#059669,#10b981)'}}>Go to Login →</button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">⏳</div>
              <h1 className="text-2xl font-black text-gray-900 mb-3">Registration Submitted!</h1>
              <p className="text-gray-500 text-sm mb-6">Under review. Platform admin will activate your account shortly.</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
                <p className="text-yellow-700 text-sm font-semibold">⏳ Pending approval</p>
                <p className="text-yellow-600 text-xs mt-1">Page auto-updates every 5 seconds.</p>
              </div>
              <button onClick={() => router.push('/')} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white" style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)'}}>Go to Login</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: "Company Info", icon: "🏢" },
    { num: 2, label: "Admin Account", icon: "👤" },
    { num: 3, label: "Review", icon: "✅" },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden">
      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(15px)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(15px)} to{opacity:1;transform:translateY(0)} }
        .orb-a { animation: floatA 8s ease-in-out infinite; }
        .orb-b { animation: floatB 10s ease-in-out infinite; }
        .slide-in { animation: slideIn 0.7s ease forwards; }
        .slide-right { animation: slideRight 0.7s ease forwards; }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .btn-hover { transition: all 0.2s ease; }
        .btn-hover:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.5) !important; }
      `}</style>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[40%] relative flex-col overflow-hidden" style={{background:'linear-gradient(145deg,#1e3a8a 0%,#1d4ed8 50%,#2563eb 80%,#60a5fa 100%)'}}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb-a absolute w-80 h-80 rounded-full" style={{background:'radial-gradient(circle,rgba(255,255,255,0.12),transparent)',top:'-4rem',right:'-4rem'}} />
          <div className="orb-b absolute w-56 h-56 rounded-full" style={{background:'radial-gradient(circle,rgba(255,255,255,0.08),transparent)',bottom:'4rem',left:'-2rem'}} />
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
            <h1 className="text-4xl font-black text-white leading-tight mb-5 tracking-tight">Start your HR<br />journey<br /><span className="text-blue-200">today.</span></h1>
            <p className="text-blue-100 text-sm leading-relaxed mb-10 opacity-80 max-w-xs">Join companies managing their workforce smarter with HRMPro Enterprise.</p>
            {/* Step indicators on left */}
            <div className="space-y-4 mb-10">
              {steps.map((s) => (
                <div key={s.num} className={`flex items-center gap-4 transition-all ${step === s.num ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm transition-all"
                    style={{background: step >= s.num ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', border: step === s.num ? '2px solid white' : '1px solid rgba(255,255,255,0.2)'}}>
                    <span className="text-white">{step > s.num ? '✓' : `0${s.num}`}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{s.label}</p>
                    <p className="text-blue-200 text-xs opacity-70">{s.icon}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['Free setup','Instant access','Secure data','24/7 support'].map((b,i) => (
                <div key={i} className="flex items-center gap-2 text-blue-100 text-xs"><span className="text-green-300">✓</span>{b}</div>
              ))}
            </div>
          </div>
          <p className="text-blue-300 text-xs opacity-50">© 2026 HRMPro Enterprise</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[60%] flex items-center justify-center bg-gray-50 p-8 min-h-screen overflow-y-auto">
        <div className={`w-full max-w-[560px] py-8 ${animIn ? 'slide-right' : 'opacity-0'}`}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><span className="text-white font-black text-sm">H</span></div>
            <span className="text-gray-900 font-black text-lg">HRMPro Enterprise</span>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {steps.map((s, i) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-all ${step > s.num ? 'text-white' : step === s.num ? 'text-white' : 'text-gray-400 bg-gray-100'}`}
                      style={step >= s.num ? {background:'linear-gradient(135deg,#1d4ed8,#3b82f6)'} : {}}>
                      {step > s.num ? '✓' : s.num}
                    </div>
                    <p className={`text-xs mt-1 font-semibold ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>{s.label}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-1 mx-2 rounded-full mb-5" style={{background: step > s.num ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : '#e5e7eb'}}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-5 text-sm flex items-start gap-2">
              <span className="mt-0.5">⚠️</span><span>{error}</span>
            </div>
          )}

          {/* STEP 1 - Company Info */}
          {step === 1 && (
            <div className="fade-up bg-white rounded-3xl p-8 space-y-5" style={{boxShadow:'0 4px 40px rgba(0,0,0,0.06)'}}>
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">Company Information</h2>
                <p className="text-gray-400 text-sm">Tell us about your organization</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} onBlur={e => validateField("companyName", e.target.value)} placeholder="Enter company name" className={inputClass("companyName")} />
                {fieldErrors.companyName && <p className="text-xs text-red-500 mt-1">{fieldErrors.companyName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                  <select value={form.industry} onChange={e => { setForm({...form, industry: e.target.value}); if (e.target.value !== "Other") setCustomIndustry(""); }} className={inputClass("industry")}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  {form.industry === "Other" && (
                    <input type="text" value={customIndustry} onChange={e => { setCustomIndustry(e.target.value); setForm({...form, industry: e.target.value}); }} placeholder="Enter your industry" className={inputClass("customIndustry") + " mt-2"} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Size</label>
                  <select value={form.companySize} onChange={e => setForm({...form, companySize: e.target.value})} className={inputClass("companySize")}>
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Phone</label>
                  <input type="tel" value={form.companyPhone} onChange={e => setForm({...form, companyPhone: e.target.value})} onBlur={e => validateField("companyPhone", e.target.value)} placeholder="03XXXXXXXXX" className={inputClass("companyPhone")} />
                  {fieldErrors.companyPhone && <p className="text-xs text-red-500 mt-1">{fieldErrors.companyPhone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                  <input type="text" value={form.website} onChange={e => setForm({...form, website: e.target.value})} onBlur={e => validateField("website", e.target.value)} placeholder="www.company.com" className={inputClass("website")} />
                  {fieldErrors.website && <p className="text-xs text-red-500 mt-1">{fieldErrors.website}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  {(() => { const cities = (CITIES_BY_COUNTRY as any)[form.country] || []; const isOther = form.city !== "" && !cities.filter((c: string) => c !== "Other").includes(form.city); return cities.length > 0 ? (<><select value={isOther ? "Other" : form.city} onChange={e => { if (e.target.value === "Other") { setForm({...form, city: "CUSTOM_"}); } else { setForm({...form, city: e.target.value}); }}} className={inputClass("city")}><option value="">Select city</option>{cities.map((c: string) => <option key={c} value={c}>{c}</option>)}</select>{(isOther || form.city === "CUSTOM_") && <input type="text" value={form.city === "CUSTOM_" ? "" : form.city} onChange={e => setForm({...form, city: e.target.value || "CUSTOM_"})} placeholder="Enter your city name" className={inputClass("city") + " mt-2"} />}</>) : (<input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Enter city name" className={inputClass("city")} />); })()}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <select value={form.country === customCountry && customCountry !== "" ? "Other" : form.country} onChange={e => { if (e.target.value === "Other") { setCustomCountry(""); setForm({...form, country: ""}); } else { setCustomCountry(""); setForm({...form, country: e.target.value}); }}} className={inputClass("country")}>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {form.country === "" && (
                    <input type="text" value={customCountry} onChange={e => { setCustomCountry(e.target.value); setForm({...form, country: e.target.value}); }} placeholder="Enter your country" className={inputClass("customCountry") + " mt-2"} />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Enter address" className={inputClass("address")} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Registration No. <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="text" value={form.regNumber} onChange={e => setForm({...form, regNumber: e.target.value})} placeholder="Business reg. number" className={inputClass("regNumber")} />
                </div>
              </div>
              <button onClick={handleNext} className="btn-hover w-full py-3.5 rounded-2xl text-sm font-bold text-white" style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',boxShadow:'0 4px 15px rgba(59,130,246,0.4)'}}>
                Next: Admin Account →
              </button>
            </div>
          )}

          {/* STEP 2 - Admin Account */}
          {step === 2 && (
            <div className="fade-up bg-white rounded-3xl p-8 space-y-5" style={{boxShadow:'0 4px 40px rgba(0,0,0,0.06)'}}>
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">Admin Account</h2>
                <p className="text-gray-400 text-sm">Create your administrator login credentials</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})} onBlur={e => validateField("adminName", e.target.value)} placeholder="Enter full name" className={inputClass("adminName")} />
                  {fieldErrors.adminName && <p className="text-xs text-red-500 mt-1">{fieldErrors.adminName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                  <select value={showCustomDesignation ? "Other" : form.adminDesignation} onChange={e => { if (e.target.value === "Other") { setShowCustomDesignation(true); setForm({...form, adminDesignation: customDesignation}); } else { setShowCustomDesignation(false); setCustomDesignation(""); setForm({...form, adminDesignation: e.target.value}); }}} className={inputClass("adminDesignation")}>
                    <option value="">Select designation</option>
                    <option value="CEO">CEO</option>
                    <option value="Director">Director</option>
                    <option value="Manager">Manager</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Other">Other (type below)</option>
                  </select>
                  {showCustomDesignation && (
                    <input type="text" value={customDesignation} onChange={e => { setCustomDesignation(e.target.value); setForm({...form, adminDesignation: e.target.value}); }} placeholder="Enter your designation" className={inputClass("customDesignation") + " mt-2"} />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input type="tel" value={form.adminPhone} onChange={e => setForm({...form, adminPhone: e.target.value})} onBlur={e => validateField("adminPhone", e.target.value)} placeholder="03XXXXXXXXX" className={inputClass("adminPhone")} />
                  {fieldErrors.adminPhone && <p className="text-xs text-red-500 mt-1">{fieldErrors.adminPhone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">CNIC <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="text" value={form.adminCnic} onChange={e => setForm({...form, adminCnic: e.target.value})} onBlur={e => validateField("adminCnic", e.target.value)} placeholder="XXXXX-XXXXXXX-X" className={inputClass("adminCnic")} />
                  {fieldErrors.adminCnic && <p className="text-xs text-red-500 mt-1">{fieldErrors.adminCnic}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                <input type="email" value={form.adminEmail} onChange={e => { setForm({...form, adminEmail: e.target.value}); setEmailVerified(false); setEmailOtpSent(false); }} onBlur={e => validateField("adminEmail", e.target.value)} placeholder="Enter email address" className={inputClass("adminEmail") + " flex-1"} />
                {emailVerified ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-bold px-3 bg-green-50 rounded-xl border border-green-200">✅ Verified</span>
                ) : (
                  <button type="button" onClick={sendEmailOtp} disabled={otpLoading || !form.adminEmail.includes("@")} className="px-4 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-50 whitespace-nowrap" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>{otpLoading ? "..." : emailOtpSent ? "Resend" : "Verify"}</button>
                )}
              </div>
              {emailOtpSent && !emailVerified && (
                <div className="mt-2 space-y-2">
                  <input type="text" value={emailOtp} onChange={e => setEmailOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} className="w-full border-2 border-blue-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 text-center font-bold tracking-widest focus:outline-none focus:border-blue-500" />
                  <button type="button" onClick={verifyEmailOtp} disabled={otpLoading} className="w-full py-2 text-sm font-bold text-white rounded-xl disabled:opacity-50" style={{background:"linear-gradient(135deg,#059669,#10b981)"}}>{otpLoading ? "Verifying..." : "Confirm OTP"}</button>
                </div>
              )}
              {otpError && <p className="text-xs text-red-500 mt-1">{otpError}</p>}
                {fieldErrors.adminEmail && <p className="text-xs text-red-500 mt-1">{fieldErrors.adminEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})} onBlur={e => validateField("adminPassword", e.target.value)} placeholder="Enter password" className={inputClass("adminPassword") + " pr-16"} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-medium">{showPw ? "Hide" : "Show"}</button>
                </div>
                {fieldErrors.adminPassword && <p className="text-xs text-red-500 mt-1">{fieldErrors.adminPassword}</p>}
                {form.adminPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength</span>
                      <span className="text-xs font-bold" style={{color: getPasswordStrength(form.adminPassword).color}}>{getPasswordStrength(form.adminPassword).label}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                      <div className="h-1.5 rounded-full transition-all" style={{width: getPasswordStrength(form.adminPassword).width, background: getPasswordStrength(form.adminPassword).color}}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { label: "8+ characters", test: form.adminPassword.length >= 8 },
                        { label: "Uppercase letter", test: /[A-Z]/.test(form.adminPassword) },
                        { label: "Lowercase letter", test: /[a-z]/.test(form.adminPassword) },
                        { label: "Number", test: /[0-9]/.test(form.adminPassword) },
                        { label: "Special character", test: /[@#$!%*?&]/.test(form.adminPassword) },
                      ].map((req, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${req.test ? "text-green-500" : "text-gray-300"}`}>{req.test ? "✓" : "○"}</span>
                          <span className={`text-xs ${req.test ? "text-green-600" : "text-gray-400"}`}>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} onBlur={e => validateField("confirmPassword", e.target.value)} placeholder="Confirm password" className={inputClass("confirmPassword") + " pr-16"} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-medium">{showConfirm ? "Hide" : "Show"}</button>
                </div>
                {form.confirmPassword && (
                  <p className={`text-xs font-medium mt-1 ${form.adminPassword === form.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                    {form.adminPassword === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">← Back</button>
                <button onClick={handleNext} className="btn-hover flex-1 py-3.5 rounded-2xl text-sm font-bold text-white" style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',boxShadow:'0 4px 15px rgba(59,130,246,0.4)'}}>Next: Review →</button>
              </div>
            </div>
          )}

          {/* STEP 3 - Review */}
          {step === 3 && (
            <div className="fade-up bg-white rounded-3xl p-8 space-y-5" style={{boxShadow:'0 4px 40px rgba(0,0,0,0.06)'}}>
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">Review & Submit</h2>
                <p className="text-gray-400 text-sm">Please review your information before submitting</p>
              </div>
              {/* Company Summary */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-black text-blue-900">🏢 Company Information</p>
                  <button onClick={() => setStep(1)} className="text-xs text-blue-600 font-semibold hover:underline">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Name:</span> <span className="font-semibold text-gray-800">{form.companyName || '—'}</span></div>
                  <div><span className="text-gray-500">Industry:</span> <span className="font-semibold text-gray-800">{form.industry || '—'}</span></div>
                  <div><span className="text-gray-500">Size:</span> <span className="font-semibold text-gray-800">{form.companySize || '—'}</span></div>
                  <div><span className="text-gray-500">Phone:</span> <span className="font-semibold text-gray-800">{form.companyPhone || '—'}</span></div>
                  <div><span className="text-gray-500">City:</span> <span className="font-semibold text-gray-800">{form.city || '—'}</span></div>
                  <div><span className="text-gray-500">Country:</span> <span className="font-semibold text-gray-800">{form.country || '—'}</span></div>
                  <div><span className="text-gray-500">Website:</span> <span className="font-semibold text-gray-800">{form.website || '—'}</span></div>
                  <div><span className="text-gray-500">Address:</span> <span className="font-semibold text-gray-800">{form.address || '—'}</span></div>
                </div>
              </div>
              {/* Admin Summary */}
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-black text-purple-900">👤 Admin Account</p>
                  <button onClick={() => setStep(2)} className="text-xs text-purple-600 font-semibold hover:underline">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Name:</span> <span className="font-semibold text-gray-800">{form.adminName || '—'}</span></div>
                  <div><span className="text-gray-500">Designation:</span> <span className="font-semibold text-gray-800">{form.adminDesignation || '—'}</span></div>
                  <div><span className="text-gray-500">Email:</span> <span className="font-semibold text-gray-800">{form.adminEmail || '—'}</span></div>
                  <div><span className="text-gray-500">Phone:</span> <span className="font-semibold text-gray-800">{form.adminPhone || '—'}</span></div>
                  <div><span className="text-gray-500">Password:</span> <span className="font-semibold text-gray-800">{'•'.repeat(form.adminPassword.length)}</span></div>
                </div>
              </div>
              {/* Terms */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-blue-600" />
                <p className="text-xs text-gray-600 leading-relaxed">I agree to the <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Terms of Service</span> and <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Privacy Policy</span>. I confirm that all information provided is accurate.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">← Back</button>
                <button onClick={handleSubmit} disabled={loading || !agreed} className="btn-hover flex-1 py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed" style={{background:'linear-gradient(135deg,#059669,#10b981)',boxShadow:'0 4px 15px rgba(16,185,129,0.4)'}}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Submitting...
                    </span>
                  ) : '🚀 Submit Registration'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">Already have an account? <a href="/" className="text-blue-600 font-semibold hover:underline">Login here</a></p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}





