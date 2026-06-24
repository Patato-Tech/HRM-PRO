const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/payroll/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Redesign success toast
c = c.replace(
  `      {success && <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">✅ {success}</div>}`,
  `      {success && <div className="fixed top-6 right-6 text-white px-5 py-3.5 rounded-2xl z-50 text-sm font-bold" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 25px rgba(16,185,129,0.4)"}}>✅ {success}</div>}`
);

// 2. Redesign header
c = c.replace(
  `      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-500 text-sm mt-1">{payrolls.length} total records</p>
        </div>
        {canProcess && (
          <div className="flex gap-2">
            <button onClick={() => { setShowAddModal(true); setForm(emptyForm()); setError(''); setAutoDeductPreview([]); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
              + Add Payroll
            </button>
          </div>
        )}
      </div>`,
  `      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Payroll</h1>
          <p className="text-gray-400 text-sm mt-0.5">{payrolls.length} total records</p>
        </div>
        {canProcess && (
          <button onClick={() => { setShowAddModal(true); setForm(emptyForm()); setError(''); setAutoDeductPreview([]); }}
            className="text-white px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>
            + Add Payroll
          </button>
        )}
      </div>`
);

// 3. Redesign stat cards
c = c.replace(
  `        ].map((s, i) => (
          <div key={i} className={\`\${s.bg} rounded-2xl p-5\`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{s.label}</p>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={\`text-2xl font-bold \${s.color}\`}>{s.value}</p>
          </div>
        ))}`,
  `        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4 relative overflow-hidden"
            style={{background:["linear-gradient(135deg,#1d4ed8,#3b82f6)","linear-gradient(135deg,#059669,#10b981)","linear-gradient(135deg,#d97706,#f59e0b)","linear-gradient(135deg,#dc2626,#ef4444)"][i],boxShadow:["0 4px 15px rgba(59,130,246,0.3)","0 4px 15px rgba(16,185,129,0.3)","0 4px 15px rgba(245,158,11,0.3)","0 4px 15px rgba(239,68,68,0.3)"][i]}}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"rgba(255,255,255,0.75)"}}>{s.label}</p>
            <p className="text-2xl font-black text-white">{s.value}</p>
          </div>
        ))}`
);

// 4. Redesign tabs
c = c.replace(
  `      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm">
        {([
          { key: 'all', label: '📋 All Records' },
          { key: 'month', label: '📅 By Month' },
          canProcess && { key: 'process', label: '⚡ Process' },
          isCompanyAdmin(user?.role || '') && { key: 'settings', label: '⚙️ Settings' },
        ] as any[]).filter(Boolean).map((tab: any) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={\`px-4 py-2 rounded-lg text-sm font-medium transition-all \${activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}\`}>
            {tab.label}
          </button>
        ))}
      </div>`,
  `      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all', label: '📋 All Records' },
          { key: 'month', label: '📅 By Month' },
          canProcess && { key: 'process', label: '⚡ Process' },
          isCompanyAdmin(user?.role || '') && { key: 'settings', label: '⚙️ Settings' },
        ] as any[]).filter(Boolean).map((tab: any) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all border"
            style={activeTab === tab.key
              ? {background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"white",border:"transparent",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}
              : {background:"white",color:"#6b7280",border:"1px solid #e5e7eb"}}>
            {tab.label}
          </button>
        ))}
      </div>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
