const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/admin/dashboard/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Improve Your Account section
c = c.replace(
  `            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Your Account</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Name</p><p className="font-semibold text-gray-900">{user.name}</p></div>
                <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Email</p><p className="font-semibold text-gray-900">{user.email}</p></div>
                <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Role</p><span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">Platform Admin</span></div>
              </div>
            </div>`,
  `            <div className="rounded-2xl p-6 border border-blue-100 overflow-hidden relative" style={{background:"linear-gradient(135deg,#0f172a,#1e293b)"}}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5" style={{background:"radial-gradient(circle,white,transparent)",transform:"translate(30%,-30%)"}} />
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                  <span className="text-white">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-white text-lg">{user.name}</p>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:"rgba(59,130,246,0.2)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)"}}>Platform Admin</span>
                  </div>
                  <p className="text-slate-400 text-sm">{user.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full" style={{background:"rgba(16,185,129,0.15)",color:"#6ee7b7",border:"1px solid rgba(16,185,129,0.2)"}}>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Active Session
                </div>
              </div>
            </div>`
);

// 2. Improve Recent Companies section
c = c.replace(
  `              {companies.length === 0 ? (
                <div className="text-center py-10"><p className="text-4xl mb-3">🏢</p><p className="text-gray-500 font-medium">No active companies yet</p><p className="text-gray-400 text-xs mt-1">Companies appear here after approval</p></div>
              ) : (
                <div className="space-y-3">
                  {companies.slice(0, 5).map(company => (
                    <div key={company.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer" onClick={() => { setSelectedCompany(company); setShowDetailModal(true); }}>
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm">{company.name.charAt(0).toUpperCase()}</div>
                        <div><p className="font-semibold text-gray-900 text-sm">{company.name}</p><p className="text-xs text-gray-400">{company.industry || 'No industry'} · {new Date(company.createdAt).toLocaleDateString()}</p></div>
                      </div>
                      <span className={\`text-xs px-2.5 py-1 rounded-full font-semibold \${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>{company.status}</span>
                    </div>
                  ))}
                </div>
              )}`,
  `              {companies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🏢</div>
                  <p className="text-gray-600 font-semibold">No active companies yet</p>
                  <p className="text-gray-400 text-xs mt-1">Companies appear here after approval</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {companies.slice(0, 5).map((company, i) => (
                    <div key={company.id} className="company-row flex items-center justify-between p-4 rounded-2xl cursor-pointer border border-transparent hover:border-blue-100" style={{background:"#f8fafc"}} onClick={() => { setSelectedCompany(company); setShowDetailModal(true); }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{background:\`linear-gradient(135deg,\${['#1d4ed8','#7c3aed','#059669','#dc2626','#d97706'][i%5]},\${['#3b82f6','#8b5cf6','#10b981','#ef4444','#f59e0b'][i%5]})\`}}>
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{company.name}</p>
                          <p className="text-xs text-gray-400">{company.industry || 'No industry'} · {new Date(company.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={\`text-xs px-2.5 py-1 rounded-full font-bold \${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                          {company.status === 'active' ? '● Active' : '● Inactive'}
                        </span>
                        <span className="text-gray-300 text-xs">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}`
);

// 3. Improve companies table actions
c = c.replaceAll(
  `<button onClick={() => { setSelectedCompany(company); setShowDetailModal(true); }} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg">View</button>
                          <button onClick={() => openEditModal(company)} className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg">Edit</button>
                          <button onClick={() => { setSelectedCompany(company); setResetPassword(''); setResetConfirm(''); setError(''); setShowResetModal(true); }} className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg">Reset Pwd</button>
                          <button onClick={() => handleToggleStatus(company)} className={\`text-xs px-2.5 py-1.5 rounded-lg \${company.status === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}\`}>
                            {company.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>`,
  `<button onClick={() => { setSelectedCompany(company); setShowDetailModal(true); }} className="action-btn text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-xl">View</button>
                          <button onClick={() => openEditModal(company)} className="action-btn text-xs font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-xl">Edit</button>
                          <button onClick={() => { setSelectedCompany(company); setResetPassword(''); setResetConfirm(''); setError(''); setShowResetModal(true); }} className="action-btn text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-xl">Reset Pwd</button>
                          <button onClick={() => handleToggleStatus(company)} className={\`action-btn text-xs font-semibold px-3 py-1.5 rounded-xl \${company.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}\`}>
                            {company.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>`
);

// 4. Improve the max width and padding
c = c.replace(
  `      <div className="max-w-7xl mx-auto p-6">`,
  `      <div className="max-w-7xl mx-auto px-8 py-6">`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
