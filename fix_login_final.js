const fs = require("fs");

const loginPage = `"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [focused, setFocused] = useState("");
  const [mounted, setMounted] = useState(false);
  const [popup, setPopup] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  const getErrorPopup = (msg) => {
    if (msg.includes("COMPANY_DELETED")) return { title: "Company Deleted", message: "Your company account has been permanently deleted.", icon: "🚫", color: "red" };
    if (msg.includes("COMPANY_DEACTIVATED") || msg.includes("deactivated")) return { title: "Account Deactivated", message: "Your company has been deactivated by the platform administrator.", icon: "⛔", color: "red" };
    if (msg.includes("SESSION_INVALIDATED")) return { title: "Session Expired", message: "Your password was changed. Please login again.", icon: "🔄", color: "yellow" };
    if (msg.includes("pending")) return { title: "Pending Approval", message: "Your company is awaiting platform administrator approval.", icon: "⏳", color: "yellow" };
    return null;
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError(""); setPopup(null);
    try {
      const data = await apiCall("/auth/login", { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user_role", data.user.role);
      localStorage.setItem("user_name", (data.user.name || "").trim());
      localStorage.setItem("user_email", data.user.email);
      localStorage.setItem("user_id", data.user.id);
      localStorage.setItem("user_companyId", data.user.companyId);
      localStorage.setItem("user_companyName", data.user.companyName || "");
      localStorage.setItem("user_employeeId", data.user.employeeId || "");
      localStorage.setItem("user_departmentId", data.user.departmentId || "");
      localStorage.setItem("user_departmentName", data.user.departmentName || "");
      localStorage.setItem("user_designation", data.user.designation || "");
      localStorage.setItem("user_customRoleName", data.user.customRoleName || "");
      localStorage.setItem("user_permissions", data.user.permissions ? JSON.stringify(data.user.permissions) : "");
      localStorage.setItem("user_customRoleScope", data.user.customRoleScope || "");
      router.replace("/dashboard");
    } catch (err) {
      const msg = err.message || "Invalid credentials";
      const p = getErrorPopup(msg);
      if (p) setPopup(p); else setError(msg);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  const stats = [
    { value: "10K+", label: "Employees managed" },
    { value: "500+", label: "Companies onboarded" },
    { value: "99.9%", label: "Uptime guaranteed" },
  ];

  const features = [
    { icon: "👥", label: "Employee Management" },
    { icon: "📅", label: "Attendance Tracking" },
    { icon: "💰", label: "Payroll Processing" },
    { icon: "📊", label: "Advanced Analytics" },
    { icon: "🌿", label: "Leave Management" },
    { icon: "📋", label: "Custom Reports" },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col overflow-hidden" style={{background:"linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 40%,#2563eb 70%,#3b82f6 100%)"}}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full opacity-10" style={{background:"radial-gradient(circle,#ffffff,transparent)",top:"-5rem",right:"-5rem",animation:"float 8s ease-in-out infinite"}} />
          <div className="absolute w-64 h-64 rounded-full opacity-10" style={{background:"radial-gradient(circle,#ffffff,transparent)",bottom:"5rem",left:"-3rem",animation:"float 10s ease-in-out infinite reverse"}} />
          <div className="absolute w-48 h-48 rounded-full opacity-5" style={{background:"radial-gradient(circle,#ffffff,transparent)",top:"50%",left:"40%",animation:"float 12s ease-in-out infinite"}} />
        </div>
        <style>{\`
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .fade-up { animation: fadeUp 0.6s ease forwards; }
          .fade-up-1 { animation-delay: 0.1s; opacity:0; }
          .fade-up-2 { animation-delay: 0.2s; opacity:0; }
          .fade-up-3 { animation-delay: 0.3s; opacity:0; }
          .fade-up-4 { animation-delay: 0.4s; opacity:0; }
        \`}</style>
        <div className="relative z-10 flex flex-col h-full p-14">
          {/* Logo */}
          <div className="flex items-center gap-3 fade-up fade-up-1">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-blue-700 font-black text-lg">H</span>
            </div>
            <div>
              <p className="text-white font-black text-lg leading-none">HRMPro</p>
              <p className="text-blue-200 text-xs">Enterprise Edition</p>
            </div>
          </div>
          {/* Main copy */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="fade-up fade-up-2 mb-10">
              <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-4">Human Resource Management</p>
              <h1 className="text-5xl font-black text-white leading-[1.1] mb-5">
                Your entire<br />workforce,<br /><span className="text-blue-200">one platform.</span>
              </h1>
              <p className="text-blue-100 text-base leading-relaxed opacity-80 max-w-sm">
                From hire to retire — manage attendance, payroll, leaves, and performance all in one beautifully designed platform.
              </p>
            </div>
            {/* Stats */}
            <div className="fade-up fade-up-3 grid grid-cols-3 gap-4 mb-10">
              {stats.map((s,i) => (
                <div key={i} className="bg-white bg-opacity-10 backdrop-blur rounded-2xl p-4 border border-white border-opacity-20">
                  <p className="text-white font-black text-2xl">{s.value}</p>
                  <p className="text-blue-200 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            {/* Features grid */}
            <div className="fade-up fade-up-4 grid grid-cols-2 gap-2">
              {features.map((f,i) => (
                <div key={i} className="flex items-center gap-2.5 bg-white bg-opacity-10 rounded-xl px-3 py-2.5 border border-white border-opacity-10">
                  <span className="text-base">{f.icon}</span>
                  <span className="text-white text-xs font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Footer */}
          <p className="text-blue-300 text-xs opacity-60">© 2026 HRMPro Enterprise · All rights reserved</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[45%] flex items-center justify-center bg-gray-50 p-8 min-h-screen">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black">H</span>
            </div>
            <span className="text-gray-900 font-black text-lg">HRMPro Enterprise</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-400 text-sm">Sign in to access your workspace</p>
          </div>

          {/* Popup */}
          {popup && (
            <div className={\`rounded-2xl p-4 mb-5 border \${popup.color === "red" ? "bg-red-50 border-red-200 text-red-800" : "bg-yellow-50 border-yellow-200 text-yellow-800"}\`}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{popup.icon}</span>
                <div>
                  <p className="font-bold text-sm">{popup.title}</p>
                  <p className="text-xs mt-0.5 opacity-80">{popup.message}</p>
                </div>
              </div>
              <button onClick={() => setPopup(null)} className="text-xs underline opacity-60 hover:opacity-100 mt-2">Dismiss</button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                <div className={\`relative transition-all duration-200 \${focused === "email" ? "transform scale-[1.01]" : ""}\`}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                    onKeyDown={handleKeyDown}
                    placeholder="you@company.com"
                    className={\`w-full rounded-2xl px-4 py-3.5 text-sm text-gray-900 outline-none transition-all duration-200 bg-gray-50 \${focused === "email" ? "border-2 border-blue-500 bg-white shadow-sm shadow-blue-100" : "border-2 border-transparent"}\`}
                  />
                </div>
              </div>
              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className={\`relative transition-all duration-200 \${focused === "password" ? "transform scale-[1.01]" : ""}\`}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused("")}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your password"
                    className={\`w-full rounded-2xl px-4 py-3.5 pr-12 text-sm text-gray-900 outline-none transition-all duration-200 bg-gray-50 \${focused === "password" ? "border-2 border-blue-500 bg-white shadow-sm shadow-blue-100" : "border-2 border-transparent"}\`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {/* Submit */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 relative overflow-hidden disabled:opacity-60"
                style={{background: loading ? "#3b82f6" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 4px 20px rgba(59,130,246,0.4)"}}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : "Sign In →"}
              </button>
            </div>
          </div>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              New company?{" "}
              <a href="/register" className="text-blue-600 font-semibold hover:underline">Register here</a>
            </p>
            <p className="text-xs text-gray-400">
              Platform Admin?{" "}
              <a href="/admin" className="text-blue-500 hover:underline">Login here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync("C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/page.tsx", loginPage, "utf8");
console.log("Done! Lines: " + loginPage.split("\n").length);
