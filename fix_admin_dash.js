const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/admin/dashboard/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Redesign navbar
c = c.replace(
  `  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg">H</div>
          <div><span className="font-bold text-gray-900">HRMPro Enterprise</span><span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Platform Admin</span></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block"><p className="text-sm font-semibold text-gray-900">{user.name}</p><p className="text-xs text-gray-400">{user.email}</p></div>
          <button onClick={logout} className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl font-medium">Logout</button>
        </div>
      </nav>`,
  `  return (
    <div className="min-h-screen" style={{background:"#f8fafc"}}>
      <style>{\`
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .nav-item { transition: all 0.2s ease; }
        .nav-item:hover { background: rgba(255,255,255,0.1) !important; }
        .stat-card { transition: all 0.2s ease; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.1) !important; }
        .tab-btn { transition: all 0.2s ease; }
        .company-row { transition: all 0.15s ease; }
        .company-row:hover { background: #f8fafc !important; }
        .action-btn { transition: all 0.15s ease; }
        .action-btn:hover { transform: translateY(-1px); }
      \`}</style>
      <nav style={{background:"linear-gradient(135deg,#0f172a,#1e293b)",borderBottom:"1px solid rgba(255,255,255,0.08)"}} className="px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
            <span className="text-white">H</span>
          </div>
          <div>
            <p className="font-black text-white text-sm tracking-tight">HRMPro Enterprise</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" style={{animation:"pulse 2s infinite"}} />
              <span className="text-xs text-slate-400 font-medium">Platform Administration</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
            <span className="text-white">{user.name?.charAt(0).toUpperCase()}</span>
          </div>
          <button onClick={logout} className="text-xs font-semibold px-4 py-2 rounded-xl transition-all" style={{background:"rgba(239,68,68,0.15)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.2)"}}>
            Logout
          </button>
        </div>
      </nav>`
);

// 2. Redesign success toast
c = c.replace(
  `      {success && <div className="fixed top-20 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">✅ {success}</div>}`,
  `      {success && <div className="fixed top-20 right-6 text-white px-5 py-3.5 rounded-2xl shadow-2xl z-50 text-sm font-semibold flex items-center gap-2" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 30px rgba(16,185,129,0.4)"}}>✅ {success}</div>}`
);

// 3. Redesign page header
c = c.replace(
  `        <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1><p className="text-gray-500 text-sm mt-1">Manage all registered companies</p></div>`,
  `        <div className="mb-8 pt-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and monitor all registered companies</p>
        </div>`
);

// 4. Redesign tabs
c = c.replace(
  `        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm flex-wrap">
          {([
            { key: 'overview', label: '📊 Overview' },
            { key: 'companies', label: '🏢 Companies' },
            { key: 'pending', label: \`⏳ Pending\${stats?.pendingCompanies ? \` (\${stats.pendingCompanies})\` : ''}\` },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={\`px-5 py-2 rounded-lg text-sm font-medium transition-all \${activeTab === tab.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}>
              {tab.label}
            </button>
          ))}
        </div>`,
  `        <div className="flex gap-2 mb-8 flex-wrap">
          {([
            { key: 'overview', label: '📊 Overview' },
            { key: 'companies', label: '🏢 Companies' },
            { key: 'pending', label: \`⏳ Pending\${stats?.pendingCompanies ? \` (\${stats.pendingCompanies})\` : ''}\` },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="tab-btn px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border"
              style={activeTab === tab.key ? {background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"white",border:"transparent",boxShadow:"0 4px 15px rgba(59,130,246,0.4)"} : {background:"white",color:"#6b7280",border:"1px solid #e5e7eb"}}>
              {tab.label}
            </button>
          ))}
        </div>`
);

// 5. Redesign stats cards
c = c.replace(
  `              {[
                { label: 'Total Companies', value: stats?.totalCompanies ?? 0, color: 'text-gray-900', bg: 'bg-blue-50', icon: '🏢' },
                { label: 'Active', value: stats?.activeCompanies ?? 0, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
                { label: 'Inactive', value: stats?.inactiveCompanies ?? 0, color: 'text-red-500', bg: 'bg-red-50', icon: '🚫' },
                { label: 'Pending Approval', value: stats?.pendingCompanies ?? 0, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏳' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3"><p className="text-sm text-gray-500 font-medium">{s.label}</p><div className={\`\${s.bg} w-10 h-10 rounded-xl flex items-center justify-center text-xl\`}>{s.icon}</div></div>
                  <p className={\`text-4xl font-bold \${s.color}\`}>{s.value}</p>
                </div>
              ))}`,
  `              {[
                { label: 'Total Companies', value: stats?.totalCompanies ?? 0, color: '#1e40af', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', icon: '🏢', border: '#bfdbfe' },
                { label: 'Active', value: stats?.activeCompanies ?? 0, color: '#065f46', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', icon: '✅', border: '#bbf7d0' },
                { label: 'Inactive', value: stats?.inactiveCompanies ?? 0, color: '#991b1b', bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)', icon: '🚫', border: '#fecaca' },
                { label: 'Pending Approval', value: stats?.pendingCompanies ?? 0, color: '#92400e', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', icon: '⏳', border: '#fde68a' },
              ].map((s, i) => (
                <div key={i} className="stat-card rounded-2xl p-6 border" style={{background:s.bg,borderColor:s.border,boxShadow:"0 2px 15px rgba(0,0,0,0.05)"}}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{color:s.color,opacity:0.7}}>{s.label}</p>
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                  <p className="text-4xl font-black" style={{color:s.color}}>{s.value}</p>
                </div>
              ))}`
);

// 6. Redesign table header
c = c.replace(
  `                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Company', 'Industry', 'Plan', 'Status', 'Created', 'Actions'].map(h => <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                </thead>`,
  `                <thead>
                  <tr style={{background:"linear-gradient(135deg,#0f172a,#1e293b)"}}>
                    {['Company', 'Industry', 'Plan', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} className="text-left px-6 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>`
);

// 7. Redesign company rows
c = c.replace(
  `                    <tr key={company.id} className="hover:bg-gray-50">`,
  `                    <tr key={company.id} className="company-row border-b border-gray-50">`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
