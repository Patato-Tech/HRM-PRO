const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/register/page.tsx";
let lines = fs.readFileSync(file, "utf8").split("\n");
const top = lines.slice(0, 60).join("\n");
const newReturn = `  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 w-full max-w-md p-10 text-center">
          {approved ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🎉</div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Company Approved!</h1>
              <p className="text-gray-500 text-sm mb-6">Your company account has been approved. You can now log in to your dashboard.</p>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                <p className="text-green-700 text-sm font-semibold">✅ Account is now active</p>
              </div>
              <button onClick={() => router.push("/")} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-green-200">
                Login Now →
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">⏳</div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Registration Submitted!</h1>
              <p className="text-gray-500 text-sm mb-6">Your registration is pending review by the platform administrator.</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
                <p className="text-yellow-700 text-sm font-semibold">⚠️ Pending approval</p>
                <p className="text-yellow-600 text-xs mt-1">This page auto-updates every 30 seconds.</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mb-6">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500" />
                Checking approval status...
              </div>
              <button onClick={() => router.push("/")} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-blue-200">
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
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
            Start your HR<br />journey<br /><span className="text-blue-200">today.</span>
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">Join hundreds of companies managing their workforce smarter with HRMPro Enterprise.</p>
          <div className="space-y-3">
            {[{icon:"⚡",label:"Quick setup in minutes"},{icon:"🔒",label:"Enterprise-grade security"},{icon:"📊",label:"Real-time analytics"},{icon:"🌍",label:"Multi-company support"}].map((f,i) => (
              <div key={i} className="flex items-center gap-3 text-blue-100 text-sm">
                <span className="text-lg">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-blue-300 text-xs">© 2026 HRMPro Enterprise. All rights reserved.</p>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 min-h-screen overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg">H</div>
            <p className="text-gray-900 font-black text-lg">HRMPro Enterprise</p>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Register Company 🏢</h1>
            <p className="text-gray-500 text-sm">Create your HRMPro Enterprise account</p>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Company Information</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
                  <input type="text" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="Acme Corporation"
                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                    <input type="text" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} placeholder="Technology"
                      className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="City, Country"
                      className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 text-sm" />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Admin Account</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input type="text" value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})} placeholder="John Smith"
                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input type="email" value={form.adminEmail} onChange={e => setForm({...form, adminEmail: e.target.value})} placeholder="admin@company.com"
                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                    <input type="password" value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})} placeholder="Min 6 chars"
                      className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm *</label>
                    <input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} placeholder="Repeat password"
                      className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 text-sm" />
                  </div>
                </div>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-blue-200">
              {loading ? "Submitting..." : "Submit Registration →"}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Already have an account? <a href="/" className="text-blue-500 hover:underline font-medium">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}`;
const result = top + "\n" + newReturn;
fs.writeFileSync(file, result, "utf8");
console.log("Done! Lines: " + result.split("\n").length);
