const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/admin/page.tsx";
let lines = fs.readFileSync(file, "utf8").split("\n");
const top = lines.slice(0, 40).join("\n");
const newReturn = `  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-900 to-black flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 opacity-5 rounded-full -translate-y-48 translate-x-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 opacity-5 rounded-full translate-y-32 -translate-x-32" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">H</div>
          <div>
            <p className="text-white font-black text-xl tracking-tight">HRMPro</p>
            <p className="text-gray-400 text-xs font-medium">Enterprise Edition</p>
          </div>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-30 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-blue-300 text-xs font-semibold">Platform Administration</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Super Admin<br /><span className="text-blue-400">Control Center</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">Complete control over all companies, users, analytics and platform settings from one powerful dashboard.</p>
          <div className="space-y-3">
            {[{icon:"🏢",label:"Manage all companies"},{icon:"📊",label:"Platform-wide analytics"},{icon:"👥",label:"Cross-company transfers"},{icon:"🔐",label:"Security & compliance"}].map((f,i) => (
              <div key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="text-lg">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-gray-600 text-xs">© 2026 HRMPro Enterprise. Restricted Access.</p>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 min-h-screen">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg">H</div>
            <p className="text-gray-900 font-black text-lg">HRMPro Enterprise</p>
          </div>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-3 py-1.5 mb-4">
              <span className="text-red-500 text-xs">🔐</span>
              <span className="text-red-600 text-xs font-semibold">Super Admin Access Only</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Platform Login</h1>
            <p className="text-gray-500 text-sm">Sign in with your administrator credentials</p>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} onKeyDown={handleKeyDown} placeholder="admin@hrmpro.com"
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} onKeyDown={handleKeyDown} placeholder="Enter your password"
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 text-sm" />
            </div>
            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all text-sm shadow-lg">
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Company User? <a href="/" className="text-blue-500 hover:underline font-medium">Login here</a>
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
}`;
const result = top + "\n" + newReturn;
fs.writeFileSync(file, result, "utf8");
console.log("Done! Lines: " + result.split("\n").length);
