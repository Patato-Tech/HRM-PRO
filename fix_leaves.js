const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/leaves/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Redesign success toast
c = c.replace(
  `        <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          ✅ {success}
        </div>`,
  `        <div className="fixed top-6 right-6 text-white px-5 py-3.5 rounded-2xl z-50 text-sm font-bold" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 25px rgba(16,185,129,0.4)"}}>
          ✅ {success}
        </div>`
);

// 2. Redesign header
c = c.replace(
  `      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pendingLeaves.length} pending approval
          </p>
        </div>`,
  `      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Leave Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">{pendingLeaves.length} pending approval</p>
        </div>`
);

// 3. Redesign buttons
c = c.replace(
  `                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
              >
                🔄 Bulk Assign`,
  `                className="text-white px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 4px 12px rgba(16,185,129,0.3)"}}>
                🔄 Bulk Assign`
);
c = c.replace(
  `                className="border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-medium"
              >
                + Add Balance`,
  `                className="px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all">
                + Add Balance`
);
c = c.replace(
  `              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              + Apply Leave`,
  `              className="text-white px-4 py-2.5 rounded-xl text-sm font-bold"
              style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>
              + Apply Leave`
);

// 4. Redesign stat cards
c = c.replace(
  `        ].map((s, i) => (
          <div key={i} className={\`\${s.bg} rounded-2xl p-5 text-center\`}>
            <p className={\`text-3xl font-bold \${s.color}\`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}`,
  `        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4 relative overflow-hidden"
            style={{background:["linear-gradient(135deg,#1d4ed8,#3b82f6)","linear-gradient(135deg,#d97706,#f59e0b)","linear-gradient(135deg,#059669,#10b981)","linear-gradient(135deg,#dc2626,#ef4444)"][i],boxShadow:["0 4px 15px rgba(59,130,246,0.3)","0 4px 15px rgba(245,158,11,0.3)","0 4px 15px rgba(16,185,129,0.3)","0 4px 15px rgba(239,68,68,0.3)"][i]}}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"rgba(255,255,255,0.75)"}}>{s.label}</p>
            <p className="text-3xl font-black text-white">{s.value}</p>
          </div>
        ))}`
);

// 5. Redesign tabs
c = c.replace(
  `      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm flex-wrap">
        {(
          [
            { key: "all", label: "📋 All Leaves" },
            { key: "pending", label: \`⏳ Pending (\${pendingLeaves.length})\` },
            { key: "balance", label: "📊 Balances" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={\`px-4 py-2 rounded-lg text-sm font-medium transition-all \${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700"
            }\`}
          >
            {tab.label}
          </button>
        ))}
      </div>`,
  `      <div className="flex gap-2 flex-wrap">
        {([
          { key: "all", label: "📋 All Leaves" },
          { key: "pending", label: \`⏳ Pending (\${pendingLeaves.length})\` },
          { key: "balance", label: "📊 Balances" },
        ] as const).map((tab) => (
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

// 6. Redesign table header
c = c.replace(
  `            <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Employee", "Leave Type", "Duration", "Status", "Actions"].map((h) => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>`,
  `            <thead>
                      <tr style={{background:"linear-gradient(135deg,#0f172a,#1e293b)"}}>
                        {["Employee", "Leave Type", "Duration", "Status", "Actions"].map((h) => (
                          <th key={h} className="text-left px-6 py-3.5 text-xs font-black text-slate-300 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>`
);

// 7. Improve search
c = c.replace(
  `              <input
                type="text"
                placeholder="Search by name or leave type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />`,
  `              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input type="text" placeholder="Search by name or leave type..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50" />
              </div>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
