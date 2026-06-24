const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/page.tsx";
let lines = fs.readFileSync(file, "utf8").split("\n");
// Keep lines 0-89 (the imports, state, handlers)
const top = lines.slice(0, 90).join("\n");
const newReturn = `  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-y-48 translate-x-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full translate-y-32 -translate-x-32" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">H</div>
          <div>
            <p className="text-white font-black text-xl tracking-tight">HRMPro</p>
            <p className="text-blue-200 text-xs font-medium">Enterprise Edition</p>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Manage your<br />workforce<br /><span className="text-blue-200">smarter.</span>
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">Complete HR management solution for modern enterprises. Attendance, payroll, leaves and more — all in one place.</p>
          <div className="grid grid-cols-2 gap-3">
            {[{icon:"👥",label:"Employee Management"},{icon:"📅",label:"Attendance Tracking"},{icon:"💰",label:"Payroll Processing"},{icon:"📊",label:"Advanced Reports"}].map((f,i) => (
              <div key={i} className="flex items-center gap-2 bg-white bg-opacity-10 rounded-xl px-3 py-2.5">
                <span className="text-lg">{f.icon}</span>
                <span className="text-white text-xs font-semibold">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-blue-300 text-xs">© 2026 HRMPro Enterprise. All rights reserved.</p>
      </div>
      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 min-h-screen">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg">H</div>
            <p className="text-gray-900 font-black text-lg">HRMPro Enterprise</p>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome back 👋</h1>
            <p className="text-gray-500 text-sm">Sign in to your company account to continue</p>
          </div>
          {popup && (
            <div className={\`border rounded-2xl p-4 mb-5 \${popupBg[popup.color]}\`}>
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
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} onKeyDown={handleKeyDown} placeholder="you@company.com"
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} onKeyDown={handleKeyDown} placeholder="Enter your password"
                  className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 text-sm pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-blue-200">
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </div>
          <div className="mt-6 space-y-2 text-center">
            <p className="text-xs text-gray-500">New company? <a href="/register" className="text-blue-600 font-semibold hover:underline">Register here</a></p>
            <p className="text-xs text-gray-400">Platform Admin? <a href="/admin" className="text-blue-500 hover:underline">Login here</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}`;
const result = top + "\n" + newReturn;
fs.writeFileSync(file, result, "utf8");
console.log("Done! Lines: " + result.split("\n").length);
