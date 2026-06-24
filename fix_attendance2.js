const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/attendance/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Replace stat cards with gradient solid cards like dashboard
c = c.replace(
  `          ].map((s, i) => (
            <div key={i} className={\`\${s.bg} rounded-2xl p-4 border border-white\`}
              style={{boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{s.label}</p>
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className={\`text-3xl font-black \${s.color}\`}>{s.value}</p>
            </div>
          ))}`,
  `          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 relative overflow-hidden"
              style={{background:["linear-gradient(135deg,#059669,#10b981)","linear-gradient(135deg,#dc2626,#ef4444)","linear-gradient(135deg,#d97706,#f59e0b)","linear-gradient(135deg,#ea580c,#f97316)","linear-gradient(135deg,#7c3aed,#8b5cf6)","linear-gradient(135deg,#1d4ed8,#3b82f6)"][i],boxShadow:["0 4px 15px rgba(16,185,129,0.35)","0 4px 15px rgba(239,68,68,0.35)","0 4px 15px rgba(245,158,11,0.35)","0 4px 15px rgba(249,115,22,0.35)","0 4px 15px rgba(139,92,246,0.35)","0 4px 15px rgba(59,130,246,0.35)"][i]}}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"rgba(255,255,255,0.75)"}}>{s.label}</p>
              <p className="text-3xl font-black text-white">{s.value}</p>
            </div>
          ))}`
);

// 2. Improve attendance rate section
c = c.replace(
  `        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-gray-900">Today's Attendance Rate</p>`,
  `        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-gray-900 text-lg">Today's Attendance Rate</p>`
);

// 3. Improve table header
c = c.replace(
  `                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Employee", "Code", "Department", "Status", "Check In", "Check Out", "Actions"].map((h) => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>`,
  `                    <thead>
                      <tr style={{background:"linear-gradient(135deg,#0f172a,#1e293b)"}}>
                        {["Employee", "Code", "Department", "Status", "Check In", "Check Out", "Actions"].map((h) => (
                          <th key={h} className="text-left px-6 py-3.5 text-xs font-black text-slate-300 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>`
);

// 4. Improve search bar
c = c.replace(
  `                    <input type="text" placeholder="Search by name or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />`,
  `                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                      <input type="text" placeholder="Search by name or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50" />
                    </div>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
