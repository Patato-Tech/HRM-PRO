const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Enhance stat cards with deeper colors and better design
c = c.replace(
  `        <div className="stat-card rounded-2xl p-5 border border-blue-100" style={{background:"linear-gradient(135deg,#eff6ff,#dbeafe)",boxShadow:"0 2px 15px rgba(59,130,246,0.08)"}}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 opacity-70">Total Staff</p>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-lg">👥</div>
          </div>
          <p className="text-4xl font-black text-blue-900">{empStats?.total ?? 0}</p>
          <div className="flex gap-2 mt-3">
            <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ {empStats?.active ?? 0} active</span>
          </div>
        </div>

        <div className="stat-card rounded-2xl p-5 border border-green-100" style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",boxShadow:"0 2px 15px rgba(16,185,129,0.08)",animationDelay:"0.1s"}}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 opacity-70">Present Today</p>
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-lg">✅</div>
          </div>
          <p className="text-4xl font-black text-green-900">{attendance?.present ?? 0}</p>
          <div className="flex gap-2 mt-3">
            <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⏰ {attendance?.late ?? 0} late</span>
          </div>
        </div>

        <div className="stat-card rounded-2xl p-5 border border-yellow-100" style={{background:"linear-gradient(135deg,#fffbeb,#fef3c7)",boxShadow:"0 2px 15px rgba(245,158,11,0.08)",animationDelay:"0.2s"}}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-600 opacity-70">Pending Leaves</p>
            <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center text-lg">🌿</div>
          </div>
          <p className="text-4xl font-black text-yellow-900">{pendingLeaves.length}</p>
          <p className="text-xs font-semibold text-yellow-600 mt-3">Awaiting approval</p>
        </div>

        {canManagePayroll(user?.role || '') ? (
          <div className="stat-card rounded-2xl p-5 border border-purple-100" style={{background:"linear-gradient(135deg,#faf5ff,#ede9fe)",boxShadow:"0 2px 15px rgba(139,92,246,0.08)",animationDelay:"0.3s"}}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-600 opacity-70">Pending Payroll</p>
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-lg">💰</div>
            </div>
            <p className="text-4xl font-black text-purple-900">PKR {((payroll?.totalPending ?? 0) / 1000).toFixed(0)}K</p>
            <p className="text-xs font-semibold text-purple-600 mt-3">{payroll?.totalRecords ?? 0} records</p>
          </div>
        ) : (
          <div className="stat-card rounded-2xl p-5 border border-red-100" style={{background:"linear-gradient(135deg,#fef2f2,#fee2e2)",boxShadow:"0 2px 15px rgba(239,68,68,0.08)",animationDelay:"0.3s"}}>`,
  `        <div className="stat-card rounded-2xl p-6 relative overflow-hidden" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 8px 30px rgba(59,130,246,0.35)"}}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-100 opacity-80">Total Staff</p>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:"rgba(255,255,255,0.2)"}}>👥</div>
          </div>
          <p className="text-5xl font-black text-white">{empStats?.total ?? 0}</p>
          <div className="flex gap-2 mt-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:"rgba(255,255,255,0.2)",color:"white"}}>✓ {empStats?.active ?? 0} active</span>
          </div>
        </div>

        <div className="stat-card rounded-2xl p-6 relative overflow-hidden" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 30px rgba(16,185,129,0.35)",animationDelay:"0.1s"}}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-green-100 opacity-80">Present Today</p>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:"rgba(255,255,255,0.2)"}}>✅</div>
          </div>
          <p className="text-5xl font-black text-white">{attendance?.present ?? 0}</p>
          <div className="flex gap-2 mt-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:"rgba(255,255,255,0.2)",color:"white"}}>⏰ {attendance?.late ?? 0} late</span>
          </div>
        </div>

        <div className="stat-card rounded-2xl p-6 relative overflow-hidden" style={{background:"linear-gradient(135deg,#d97706,#f59e0b)",boxShadow:"0 8px 30px rgba(245,158,11,0.35)",animationDelay:"0.2s"}}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-100 opacity-80">Pending Leaves</p>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:"rgba(255,255,255,0.2)"}}>🌿</div>
          </div>
          <p className="text-5xl font-black text-white">{pendingLeaves.length}</p>
          <p className="text-xs font-bold mt-4" style={{color:"rgba(255,255,255,0.8)"}}>Awaiting approval</p>
        </div>

        {canManagePayroll(user?.role || '') ? (
          <div className="stat-card rounded-2xl p-6 relative overflow-hidden" style={{background:"linear-gradient(135deg,#7c3aed,#8b5cf6)",boxShadow:"0 8px 30px rgba(139,92,246,0.35)",animationDelay:"0.3s"}}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-100 opacity-80">Pending Payroll</p>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:"rgba(255,255,255,0.2)"}}>💰</div>
            </div>
            <p className="text-5xl font-black text-white">PKR {((payroll?.totalPending ?? 0) / 1000).toFixed(0)}K</p>
            <p className="text-xs font-bold mt-4" style={{color:"rgba(255,255,255,0.8)"}}>{payroll?.totalRecords ?? 0} records</p>
          </div>
        ) : (
          <div className="stat-card rounded-2xl p-6 relative overflow-hidden" style={{background:"linear-gradient(135deg,#dc2626,#ef4444)",boxShadow:"0 8px 30px rgba(239,68,68,0.35)",animationDelay:"0.3s"}}>`
);

// 2. Fix absent card
c = c.replace(
  `            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-red-600 opacity-70">Absent Today</p>
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-lg">❌</div>
            </div>
            <p className="text-4xl font-black text-red-900">{attendance?.absent ?? 0}</p>
            <p className="text-xs font-semibold text-red-600 mt-3">{attendance?.late ?? 0} late arrivals</p>
          </div>`,
  `            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-red-100 opacity-80">Absent Today</p>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:"rgba(255,255,255,0.2)"}}>❌</div>
            </div>
            <p className="text-5xl font-black text-white">{attendance?.absent ?? 0}</p>
            <p className="text-xs font-bold mt-4" style={{color:"rgba(255,255,255,0.8)"}}>{attendance?.late ?? 0} late arrivals</p>
          </div>`
);

// 3. Enhance attendance overview mini cards
c = c.replace(
  `        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Present', value: attendance?.present ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Absent', value: attendance?.absent ?? 0, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Late', value: attendance?.late ?? 0, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          ].map((item, i) => (
            <div key={i} className={\`\${item.bg} rounded-xl p-4 text-center\`}>
              <p className={\`text-2xl font-bold \${item.color}\`}>{item.value}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-600 text-center">{attendance?.totalEmployees ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1 text-center">Total</p>
            <div className="flex flex-wrap gap-1 mt-2 justify-center">
              {recentEmployees.map((emp: any) => (
                <span key={emp.id} className={\`text-xs px-1.5 py-0.5 rounded-full font-semibold \${emp.customRole ? 'bg-blue-200 text-blue-800' : 'bg-green-100 text-green-700'}\`}>
                  {emp.customRole?.name || 'Employee'}
                </span>
              ))}
            </div>
          </div>
        </div>`,
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
        </div>`
);

// 4. Enhance quick actions
c = c.replace(
  `            <a key={i} href={action.href}
              className="action-card rounded-2xl p-5 text-center cursor-pointer text-white"
              style={{background:action.grad,boxShadow:\`0 4px 15px \${action.shadow}\`}}>
              <p className="text-3xl mb-2">{action.icon}</p>
              <p className="text-sm font-bold">{action.label}</p>
            </a>`,
  `            <a key={i} href={action.href}
              className="action-card rounded-2xl p-6 text-center cursor-pointer text-white relative overflow-hidden"
              style={{background:action.grad,boxShadow:\`0 8px 25px \${action.shadow}\`}}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
              <p className="text-4xl mb-3">{action.icon}</p>
              <p className="text-sm font-black tracking-tight">{action.label}</p>
            </a>`
);

// 5. Enhance Pending Leaves and Recent Employees card headers
c = c.replace(
  `      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {canApproveLeaves(user?.role || '') && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-900 text-lg">Pending Leaves</h2>
              <a href="/dashboard/leaves" className="text-sm text-blue-600 hover:underline">View all →</a>
            </div>`,
  `      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {canApproveLeaves(user?.role || '') && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-gray-900 text-lg">Pending Leaves</h2>
                <p className="text-xs text-gray-400 mt-0.5">{pendingLeaves.length} awaiting your decision</p>
              </div>
              <a href="/dashboard/leaves" className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100">View all →</a>
            </div>`
);

c = c.replace(
  `        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 text-lg">Recent Employees</h2>
            <a href="/dashboard/employees" className="text-sm text-blue-600 hover:underline">View all →</a>
          </div>`,
  `        <div className="bg-white rounded-2xl p-6 border border-gray-100" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-gray-900 text-lg">Recent Employees</h2>
              <p className="text-xs text-gray-400 mt-0.5">{recentEmployees.length} team members</p>
            </div>
            <a href="/dashboard/employees" className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100">View all →</a>
          </div>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
