const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Fix attendance mini cards - make more compact
c = c.replace(
  `        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Present', value: attendance?.present ?? 0, color: '#059669', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '#bbf7d0' },
            { label: 'Absent', value: attendance?.absent ?? 0, color: '#dc2626', bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '#fecaca' },
            { label: 'Late', value: attendance?.late ?? 0, color: '#d97706', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '#fde68a' },
            { label: 'Total', value: attendance?.totalEmployees ?? 0, color: '#1d4ed8', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '#bfdbfe' },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl p-4 text-center border" style={{background:item.bg,borderColor:item.border}}>
              <p className="text-3xl font-black" style={{color:item.color}}>{item.value}</p>
              <p className="text-xs font-semibold text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>`,
  `        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Present', value: attendance?.present ?? 0, color: 'white', bg: 'linear-gradient(135deg,#059669,#10b981)', shadow: 'rgba(16,185,129,0.3)' },
            { label: 'Absent', value: attendance?.absent ?? 0, color: 'white', bg: 'linear-gradient(135deg,#dc2626,#ef4444)', shadow: 'rgba(239,68,68,0.3)' },
            { label: 'Late', value: attendance?.late ?? 0, color: 'white', bg: 'linear-gradient(135deg,#d97706,#f59e0b)', shadow: 'rgba(245,158,11,0.3)' },
            { label: 'Total', value: attendance?.totalEmployees ?? 0, color: 'white', bg: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', shadow: 'rgba(59,130,246,0.3)' },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl p-4 text-center relative overflow-hidden" style={{background:item.bg,boxShadow:\`0 4px 15px \${item.shadow}\`}}>
              <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
              <p className="text-3xl font-black text-white">{item.value}</p>
              <p className="text-xs font-bold mt-1" style={{color:"rgba(255,255,255,0.8)"}}>{item.label}</p>
            </div>
          ))}
        </div>`
);

// 2. Fix progress bar
c = c.replace(
  `        <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
          <div className="flex h-full rounded-full overflow-hidden">
            <div className="bg-green-500 transition-all" style={{ width: \`\${attendance?.totalEmployees ? (attendance.present / attendance.totalEmployees) * 100 : 0}%\` }} />
            <div className="bg-yellow-400 transition-all" style={{ width: \`\${attendance?.totalEmployees ? (attendance.late / attendance.totalEmployees) * 100 : 0}%\` }} />            <div className="bg-red-400 transition-all" style={{ width: \`\${attendance?.totalEmployees ? (attendance.absent / attendance.totalEmployees) * 100 : 0}%\` }} />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Present</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>Late</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>Absent</span>
        </div>`,
  `        <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden mt-2">
          <div className="flex h-full rounded-full overflow-hidden transition-all duration-500">
            <div className="bg-green-500" style={{ width: \`\${attendance?.totalEmployees ? (attendance.present / attendance.totalEmployees) * 100 : 0}%\` }} />
            <div className="bg-yellow-400" style={{ width: \`\${attendance?.totalEmployees ? (attendance.late / attendance.totalEmployees) * 100 : 0}%\` }} />
            <div className="bg-red-400" style={{ width: \`\${attendance?.totalEmployees ? (attendance.absent / attendance.totalEmployees) * 100 : 0}%\` }} />
          </div>
        </div>
        <div className="flex items-center gap-5 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span><span className="font-medium">Present</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span><span className="font-medium">Late</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span><span className="font-medium">Absent</span></span>
        </div>`
);

// 3. Fix quick action icon size
c = c.replace(
  `              <p className="text-4xl mb-3">{action.icon}</p>
              <p className="text-sm font-black tracking-tight">{action.label}</p>`,
  `              <p className="text-5xl mb-3">{action.icon}</p>
              <p className="text-sm font-black tracking-tight">{action.label}</p>`
);

// 4. Fix recent employee items styling
c = c.replace(
  `              <div className="emp-item flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white" style={{background:\`linear-gradient(135deg,\${['#1d4ed8','#7c3aed','#059669','#dc2626','#d97706'][i%5]},\${['#3b82f6','#8b5cf6','#10b981','#ef4444','#f59e0b'][i%5]})\`}}>
                    {emp.user?.name?.charAt(0).toUpperCase()}
                  </div>`,
  `              <div className="emp-item flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-blue-100 hover:bg-blue-50">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white shadow-sm" style={{background:\`linear-gradient(135deg,\${['#1d4ed8','#7c3aed','#059669','#dc2626','#d97706'][i%5]},\${['#3b82f6','#8b5cf6','#10b981','#ef4444','#f59e0b'][i%5]})\`}}>
                    {emp.user?.name?.charAt(0).toUpperCase()}
                  </div>`
);

// 5. Fix status badges in recent employees
c = c.replace(
  `                    <span className={\`text-xs px-2 py-0.5 rounded-full font-semibold \${emp.customRole ? 'bg-blue-100 text-blue-700' : emp.user?.role === 'COMPANY_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}\`}>
                      {emp.customRole?.name || (emp.user?.role === 'COMPANY_ADMIN' ? 'Admin' : 'Employee')}
                    </span>
                    <span className={\`text-xs px-2 py-0.5 rounded-full font-semibold \${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                      {emp.status}
                    </span>`,
  `                    <span className={\`text-xs px-2.5 py-1 rounded-full font-bold \${emp.customRole ? 'bg-blue-100 text-blue-700' : emp.user?.role === 'COMPANY_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}\`}>
                      {emp.customRole?.name || (emp.user?.role === 'COMPANY_ADMIN' ? 'Admin' : 'Employee')}
                    </span>
                    <span className={\`text-xs px-2.5 py-1 rounded-full font-bold \${emp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}\`}>
                      {emp.status === 'active' ? '● Active' : '● ' + emp.status}
                    </span>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
