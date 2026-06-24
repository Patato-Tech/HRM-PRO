const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Redesign header
c = c.replace(
  `      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Reports</h1>
          <p className="text-gray-500 text-sm mt-1">{isDeptMgr ? 'Department-level reports' : 'Company-wide analytics and summaries'}</p>
        </div>`,
  `      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reports</h1>
          <p className="text-gray-400 text-sm mt-0.5">{isDeptMgr ? 'Department-level reports' : 'Company-wide analytics and summaries'}</p>
        </div>`
);

// 2. Redesign download button
c = c.replace(
  `        }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
          📄 Download Summary PDF
        </button>`,
  `        }} className="text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
          style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 4px 12px rgba(16,185,129,0.3)"}}>
          📄 Download Summary PDF
        </button>`
);

// 3. Redesign tabs
c = c.replace(
  `      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={\`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border \${
              activeTab === tab.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }\`}
          >
            {tab.label}
          </button>
        ))}
      </div>`,
  `      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
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

// 4. Redesign attendance stat cards
c = c.replace(
  `                {[
                  { label: 'Present', value: attendanceSummary?.present ?? 0, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
                  { label: 'Absent', value: attendanceSummary?.absent ?? 0, color: 'text-red-500', bg: 'bg-red-50', icon: '❌' },
                  { label: 'Late', value: attendanceSummary?.late ?? 0, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏰' },
                  { label: 'Half Day', value: (attendanceSummary as any)?.halfDay ?? 0, color: 'text-orange-500', bg: 'bg-orange-50', icon: '🌓' },
                  { label: 'On Leave', value: (attendanceSummary as any)?.onLeave ?? 0, color: 'text-purple-600', bg: 'bg-purple-50', icon: '🌿' },
                  { label: 'Total', value: attendanceSummary?.totalEmployees ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', icon: '👥' },
                ].map((s, i) => (
                  <div key={i} className={\`\${s.bg} rounded-2xl p-5\`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                      <span className="text-xl">{s.icon}</span>
                    </div>
                    <p className={\`text-3xl font-bold \${s.color}\`}>{s.value}</p>
                  </div>
                ))}`,
  `                {[
                  { label: 'Present', value: attendanceSummary?.present ?? 0, grad: 'linear-gradient(135deg,#059669,#10b981)', shadow: 'rgba(16,185,129,0.3)' },
                  { label: 'Absent', value: attendanceSummary?.absent ?? 0, grad: 'linear-gradient(135deg,#dc2626,#ef4444)', shadow: 'rgba(239,68,68,0.3)' },
                  { label: 'Late', value: attendanceSummary?.late ?? 0, grad: 'linear-gradient(135deg,#d97706,#f59e0b)', shadow: 'rgba(245,158,11,0.3)' },
                  { label: 'Half Day', value: (attendanceSummary as any)?.halfDay ?? 0, grad: 'linear-gradient(135deg,#ea580c,#f97316)', shadow: 'rgba(249,115,22,0.3)' },
                  { label: 'On Leave', value: (attendanceSummary as any)?.onLeave ?? 0, grad: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', shadow: 'rgba(139,92,246,0.3)' },
                  { label: 'Total', value: attendanceSummary?.totalEmployees ?? 0, grad: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', shadow: 'rgba(59,130,246,0.3)' },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-4 relative overflow-hidden" style={{background:s.grad,boxShadow:\`0 4px 15px \${s.shadow}\`}}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"rgba(255,255,255,0.75)"}}>{s.label}</p>
                    <p className="text-3xl font-black text-white">{s.value}</p>
                  </div>
                ))}`
);

// 5. Redesign export PDF buttons in tabs
c = c.replaceAll(
  `className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                    📄 Export PDF`,
  `className="text-white px-4 py-2 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                    📄 Export PDF`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
