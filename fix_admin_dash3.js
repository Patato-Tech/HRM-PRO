const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/admin/dashboard/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Improve Companies tab header
c = c.replace(
  `        {activeTab === 'companies' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div><h2 className="text-lg font-semibold text-gray-900">All Companies</h2><p className="text-xs text-gray-400 mt-0.5">{companies.length} companies</p></div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>`,
  `        {activeTab === 'companies' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">All Companies</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{companies.length} registered companies</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="text" placeholder="Search companies..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="border-2 border-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50 w-64" />
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                    className="border-2 border-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>`
);

// 2. Improve status badge in table
c = c.replace(
  `                      <td className="px-6 py-4"><span className={\`text-xs px-2.5 py-1 rounded-full font-semibold \${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>{company.status}</span></td>`,
  `                      <td className="px-6 py-4">
                        <span className={\`text-xs px-2.5 py-1.5 rounded-full font-bold \${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                          {company.status === 'active' ? '● Active' : '● Inactive'}
                        </span>
                      </td>`
);

// 3. Improve Pending section
c = c.replace(
  `        {activeTab === 'pending' && (
          <div className="space-y-4">
            <div><h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2><p className="text-xs text-gray-400 mt-0.5">{pendingCompanies.length} companies waiting</p></div>
            {pendingCompanies.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                <p className="text-5xl mb-4">✅</p><p className="text-gray-700 font-semibold">No pending approvals</p><p className="text-gray-400 text-sm mt-1">All registrations have been processed</p>
              </div>
            ) : pendingCompanies.map(company => (
              <div key={company.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-100 text-yellow-700 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg">{company.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="font-bold text-gray-900">{company.name}</p>
                      <p className="text-sm text-gray-500">{company.industry || 'No industry'}{company.address ? \` · \${company.address}\` : ''}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Registered {new Date(company.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(company)} disabled={approveLoading === company.id}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium">
                      {approveLoading === company.id ? 'Approving...' : '✅ Approve'}
                    </button>
                    <button onClick={() => handleReject(company)} disabled={rejectLoading === company.id}
                      className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium">
                      {rejectLoading === company.id ? 'Rejecting...' : '❌ Reject'}
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-semibold">⏳ Pending Approval</span>
                </div>
              </div>
            ))}
          </div>
        )}`,
  `        {activeTab === 'pending' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">Pending Approvals</h2>
                <p className="text-xs text-gray-400 mt-0.5">{pendingCompanies.length} companies waiting for review</p>
              </div>
              {pendingCompanies.length > 0 && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:"#fef3c7",color:"#92400e"}}>
                  ⏳ {pendingCompanies.length} Pending
                </span>
              )}
            </div>
            {pendingCompanies.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-gray-100" style={{boxShadow:"0 4px 30px rgba(0,0,0,0.05)"}}>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">✅</div>
                <p className="text-gray-800 font-black text-lg">All clear!</p>
                <p className="text-gray-400 text-sm mt-1">No pending approvals at this time</p>
              </div>
            ) : pendingCompanies.map((company, i) => (
              <div key={company.id} className="bg-white rounded-3xl p-6 border border-yellow-100 overflow-hidden relative" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white flex-shrink-0" style={{background:\`linear-gradient(135deg,\${['#d97706','#7c3aed','#059669','#dc2626','#1d4ed8'][i%5]},\${['#f59e0b','#8b5cf6','#10b981','#ef4444','#3b82f6'][i%5]})\`}}>
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-lg">{company.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{company.industry || 'No industry'}{company.address ? \` · \${company.address}\` : ''}</p>
                      <p className="text-xs text-gray-400 mt-1">Registered {new Date(company.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(company)} disabled={approveLoading === company.id}
                      className="font-bold text-white px-6 py-2.5 rounded-2xl text-sm transition-all disabled:opacity-50"
                      style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 4px 15px rgba(16,185,129,0.3)"}}>
                      {approveLoading === company.id ? 'Approving...' : '✅ Approve'}
                    </button>
                    <button onClick={() => handleReject(company)} disabled={rejectLoading === company.id}
                      className="font-bold text-white px-6 py-2.5 rounded-2xl text-sm transition-all disabled:opacity-50"
                      style={{background:"linear-gradient(135deg,#dc2626,#ef4444)",boxShadow:"0 4px 15px rgba(239,68,68,0.3)"}}>
                      {rejectLoading === company.id ? 'Rejecting...' : '❌ Reject'}
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-yellow-50 flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">⏳ Awaiting Approval</span>
                  <span className="text-xs text-gray-400">{company._count?.employees || 0} employees · {company._count?.users || 0} users</span>
                </div>
              </div>
            ))}
          </div>
        )}`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
