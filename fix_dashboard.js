const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Redesign header
c = c.replace(
  `    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.trim()?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {user?.companyName}{user?.departmentName ? \` • \${user.departmentName}\` : ''} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>`,
  `    <div className="space-y-6">
      <style>{\`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .stat-card { transition: all 0.2s ease; animation: fadeUp 0.5s ease forwards; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.1) !important; }
        .action-card { transition: all 0.2s ease; }
        .action-card:hover { transform: translateY(-3px); }
        .leave-item { transition: all 0.15s ease; }
        .leave-item:hover { background: #f0f9ff !important; }
        .emp-item { transition: all 0.15s ease; }
        .emp-item:hover { background: #f0f9ff !important; }
      \`}</style>
      {/* Header */}
      <div className="rounded-3xl p-6 relative overflow-hidden" style={{background:"linear-gradient(135deg,#0f172a,#1e293b,#1d4ed8)"}}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{background:"radial-gradient(circle,white,transparent)",transform:"translate(30%,-30%)"}} />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full opacity-5" style={{background:"radial-gradient(circle,white,transparent)"}} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-2">{user?.companyName}{user?.departmentName ? \` · \${user.departmentName}\` : ''}</p>
            <h1 className="text-2xl font-black text-white mb-1">
              Welcome back, {user?.name?.trim()?.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-400 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white font-bold text-sm">{user?.name}</p>
              <p className="text-slate-400 text-xs">{user?.role?.replace(/_/g,' ')}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg" style={{background:"linear-gradient(135deg,#3b82f6,#60a5fa)"}}>
              <span className="text-white">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>`
);

// 2. Redesign dept inactive banner
c = c.replace(
  `      {deptInactive && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-orange-800 text-sm">Your department is currently inactive</p>
            <p className="text-xs text-orange-600 mt-0.5">Some features may be restricted. Please contact your HR or Company Admin.</p>
          </div>
        </div>
      )}`,
  `      {deptInactive && (
        <div className="rounded-2xl p-4 flex items-center gap-3 border border-orange-200" style={{background:"linear-gradient(135deg,#fff7ed,#ffedd5)"}}>
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">⚠️</div>
          <div>
            <p className="font-bold text-orange-800 text-sm">Department Inactive</p>
            <p className="text-xs text-orange-600 mt-0.5">Some features may be restricted. Please contact your HR or Company Admin.</p>
          </div>
        </div>
      )}`
);

// 3. Redesign stat cards
c = c.replace(
  `      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Total Staff</p>
            <span className="bg-blue-100 text-blue-600 text-xl w-9 h-9 rounded-xl flex items-center justify-center">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{empStats?.total ?? 0}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Active: {empStats?.active ?? 0}</span>
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Inactive: {empStats?.inactive ?? 0}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {recentEmployees.map((emp: any) => (
              <span key={emp.id} className={\`text-xs px-1.5 py-0.5 rounded-full font-semibold \${emp.customRole ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}\`}>
                {emp.customRole?.name || 'Employee'}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Present Today</p>
            <span className="bg-green-100 text-green-600 text-xl w-9 h-9 rounded-xl flex items-center justify-center">✅</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{attendance?.present ?? 0}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {todayAttendance.filter((r:any) => r.status === 'present').slice(0,3).map((r:any) => (
              <span key={r.id} className={\`text-xs px-1.5 py-0.5 rounded-full font-semibold \${r.employee?.customRole ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}\`}>
                {r.employee?.user?.name?.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Pending Leaves</p>
            <span className="bg-yellow-100 text-yellow-600 text-xl w-9 h-9 rounded-xl flex items-center justify-center">🌿</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{pendingLeaves.length}</p>
          <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
        </div>

        {canManagePayroll(user?.role || '') ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">Pending Payroll</p>
              <span className="bg-purple-100 text-purple-600 text-xl w-9 h-9 rounded-xl flex items-center justify-center">💰</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">PKR {((payroll?.totalPending ?? 0) / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-400 mt-1">{payroll?.totalRecords ?? 0} records</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">`,
  `      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card rounded-2xl p-5 border border-blue-100" style={{background:"linear-gradient(135deg,#eff6ff,#dbeafe)",boxShadow:"0 2px 15px rgba(59,130,246,0.08)"}}>
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
          <div className="stat-card rounded-2xl p-5 border border-red-100" style={{background:"linear-gradient(135deg,#fef2f2,#fee2e2)",boxShadow:"0 2px 15px rgba(239,68,68,0.08)",animationDelay:"0.3s"}}>`
);

// 4. Fix the absent card that got cut off
c = c.replace(
  `          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">Absent Today</p>
              <span className="bg-red-100 text-red-500 text-xl w-9 h-9 rounded-xl flex items-center justify-center">❌</span>
            </div>
            <p className="text-3xl font-bold text-red-500">{attendance?.absent ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">{attendance?.late ?? 0} late arrivals</p>
          </div>`,
  `            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-red-600 opacity-70">Absent Today</p>
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-lg">❌</div>
            </div>
            <p className="text-4xl font-black text-red-900">{attendance?.absent ?? 0}</p>
            <p className="text-xs font-semibold text-red-600 mt-3">{attendance?.late ?? 0} late arrivals</p>
          </div>`
);

// 5. Redesign attendance overview
c = c.replace(
  `      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Today's Attendance Overview</h2>
          <a href="/dashboard/attendance" className="text-sm text-blue-600 hover:underline">View details →</a>
        </div>`,
  `      <div className="bg-white rounded-2xl p-6 border border-gray-100" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-gray-900 text-lg">Today's Attendance</h2>
          <a href="/dashboard/attendance" className="text-xs font-semibold text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-xl">View details →</a>
        </div>`
);

// 6. Redesign pending leaves section
c = c.replace(
  `            {pendingLeaves.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-gray-400 text-sm">No pending leaves</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaves.map(leave => (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">`,
  `            {pendingLeaves.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">✅</div>
                <p className="text-gray-500 font-semibold text-sm">No pending leaves</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingLeaves.map(leave => (
                  <div key={leave.id} className="leave-item flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100">`
);

// 7. Redesign approve/reject buttons
c = c.replace(
  `                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'approve')}
                        className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'reject')}
                        className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg"
                      >
                        Reject
                      </button>
                    </div>`,
  `                    <div className="flex gap-2">
                      <button onClick={() => handleLeaveAction(leave.id, 'approve')}
                        className="text-xs font-bold text-white px-3 py-1.5 rounded-xl transition-all"
                        style={{background:"linear-gradient(135deg,#059669,#10b981)"}}>
                        ✓ Approve
                      </button>
                      <button onClick={() => handleLeaveAction(leave.id, 'reject')}
                        className="text-xs font-bold text-white px-3 py-1.5 rounded-xl transition-all"
                        style={{background:"linear-gradient(135deg,#dc2626,#ef4444)"}}>
                        ✕ Reject
                      </button>
                    </div>`
);

// 8. Redesign recent employees section
c = c.replace(
  `              <div className="space-y-3">
              {recentEmployees.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                    {emp.user?.name?.charAt(0).toUpperCase()}
                  </div>`,
  `              <div className="space-y-2">
              {recentEmployees.map((emp, i) => (
                <div key={emp.id} className="emp-item flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white" style={{background:\`linear-gradient(135deg,\${['#1d4ed8','#7c3aed','#059669','#dc2626','#d97706'][i%5]},\${['#3b82f6','#8b5cf6','#10b981','#ef4444','#f59e0b'][i%5]})\`}}>
                    {emp.user?.name?.charAt(0).toUpperCase()}
                  </div>`
);

// 9. Redesign quick actions
c = c.replace(
  `      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            (hasPermission(user, 'attendance', 'view') || isCompanyAdmin(user?.role || '') || canManageEmployees(user?.role || '')) && { label: 'Mark Attendance', icon: '📅', href: '/dashboard/attendance', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
            (hasPermission(user, 'leaves', 'view') || isCompanyAdmin(user?.role || '') || canApproveLeaves(user?.role || '')) && { label: 'Apply Leave', icon: '🌿', href: '/dashboard/leaves', color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' },
            canManageEmployees(user?.role || '') && { label: 'Add Employee', icon: '👤', href: '/dashboard/employees', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
            canManagePayroll(user?.role || '') && { label: 'Process Payroll', icon: '💰', href: '/dashboard/payroll', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
          ].filter(Boolean).map((action: any, i) => (
            <a key={i} href={action.href}
              className={\`\${action.color} rounded-xl p-4 text-center transition-colors cursor-pointer\`}>
              <p className="text-2xl mb-1">{action.icon}</p>
              <p className="text-sm font-medium">{action.label}</p>
            </a>
          ))}
        </div>
      </div>`,
  `      <div className="bg-white rounded-2xl p-6 border border-gray-100" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
        <h2 className="font-black text-gray-900 text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            (hasPermission(user, 'attendance', 'view') || isCompanyAdmin(user?.role || '') || canManageEmployees(user?.role || '')) && { label: 'Mark Attendance', icon: '📅', href: '/dashboard/attendance', grad: 'linear-gradient(135deg,#059669,#10b981)', shadow: 'rgba(16,185,129,0.3)' },
            (hasPermission(user, 'leaves', 'view') || isCompanyAdmin(user?.role || '') || canApproveLeaves(user?.role || '')) && { label: 'Apply Leave', icon: '🌿', href: '/dashboard/leaves', grad: 'linear-gradient(135deg,#d97706,#f59e0b)', shadow: 'rgba(245,158,11,0.3)' },
            canManageEmployees(user?.role || '') && { label: 'Add Employee', icon: '👤', href: '/dashboard/employees', grad: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', shadow: 'rgba(59,130,246,0.3)' },
            canManagePayroll(user?.role || '') && { label: 'Process Payroll', icon: '💰', href: '/dashboard/payroll', grad: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', shadow: 'rgba(139,92,246,0.3)' },
          ].filter(Boolean).map((action: any, i) => (
            <a key={i} href={action.href}
              className="action-card rounded-2xl p-5 text-center cursor-pointer text-white"
              style={{background:action.grad,boxShadow:\`0 4px 15px \${action.shadow}\`}}>
              <p className="text-3xl mb-2">{action.icon}</p>
              <p className="text-sm font-bold">{action.label}</p>
            </a>
          ))}
        </div>
      </div>`
);

// 10. Redesign section headers
c = c.replaceAll(
  `<h2 className="font-semibold text-gray-900">Pending Leave Requests</h2>`,
  `<h2 className="font-black text-gray-900 text-lg">Pending Leaves</h2>`
);
c = c.replaceAll(
  `<h2 className="font-semibold text-gray-900">Recent Employees</h2>`,
  `<h2 className="font-black text-gray-900 text-lg">Recent Employees</h2>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
