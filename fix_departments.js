const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/departments/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Redesign header
c = c.replace(
  `      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 text-sm mt-1">{departments.length} departments</p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowAddModal(true); setError(''); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            + Add Department
          </button>
        )}
      </div>`,
  `      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Departments</h1>
          <p className="text-gray-400 text-sm mt-0.5">{departments.length} departments in your organization</p>
        </div>
        {canManage && (
          <button onClick={() => { setShowAddModal(true); setError(''); }}
            className="text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>
            + Add Department
          </button>
        )}
      </div>`
);

// 2. Redesign stats
c = c.replace(
  `      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{departments.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Departments</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{departments.filter(d => d.status === 'active').length}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-red-500">{departments.filter(d => d.status === 'inactive').length}</p>
          <p className="text-xs text-gray-500 mt-1">Inactive</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-purple-600">
            {departments.reduce((sum, d) => sum + (d._count?.employees || 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total Employees</p>
          <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {departments.flatMap(d => d.employees || []).map((emp: any) => (
              <span key={emp.id} className={\`text-xs px-1.5 py-0.5 rounded-full font-semibold \${emp.customRole ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}\`}>
                {emp.customRole?.name || 'Employee'}
              </span>
            ))}
          </div>
        </div>
      </div>`,
  `      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:"Total",value:departments.length,color:"#1d4ed8",bg:"linear-gradient(135deg,#eff6ff,#dbeafe)",border:"#bfdbfe"},
          {label:"Active",value:departments.filter(d=>d.status==='active').length,color:"#059669",bg:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"#bbf7d0"},
          {label:"Inactive",value:departments.filter(d=>d.status==='inactive').length,color:"#dc2626",bg:"linear-gradient(135deg,#fef2f2,#fee2e2)",border:"#fecaca"},
          {label:"Total Employees",value:departments.reduce((sum,d)=>sum+(d._count?.employees||0),0),color:"#7c3aed",bg:"linear-gradient(135deg,#faf5ff,#ede9fe)",border:"#ddd6fe"},
        ].map((s,i) => (
          <div key={i} className="rounded-2xl p-4 border" style={{background:s.bg,borderColor:s.border,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <p className="text-3xl font-black" style={{color:s.color}}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>`
);

// 3. Redesign search
c = c.replace(
  `      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <input
          type="text"
          placeholder="Search departments..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
      </div>`,
  `      <div className="bg-white rounded-2xl p-4 border border-gray-100" style={{boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="Search departments..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50 transition-all" />
        </div>
      </div>`
);

// 4. Redesign department cards
c = c.replace(
  `          {filtered.map(dept => (
            <div key={dept.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-700 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg">
                    {dept.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{dept.name}</p>
                    <p className="text-xs text-gray-400">
                      Created {new Date(dept.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="bg-gray-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-xl font-bold text-gray-900">{dept._count?.employees || 0}</p>
                  <p className="text-xs text-gray-500">Employees</p>
                </div>
                <div className="flex gap-1">
                  <span className={\`text-xs px-2.5 py-1 rounded-full font-semibold \${dept.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                    {dept.status}
                  </span>
                  {(dept._count?.employees || 0) === 0 && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-500">Empty</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetail(dept)}
                  className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-xl text-xs font-medium transition-colors"
                >
                  View Members
                </button>
                {canManage && (
                  <>
                    <button
                      onClick={() => openEditModal(dept)}
                      className="flex-1 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 py-2 rounded-xl text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(dept)}
                      className={\`px-3 py-2 rounded-xl text-xs transition-colors \${dept.status === 'active' ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}\`}
                    >
                      {dept.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}`,
  `          {filtered.map((dept, i) => (
            <div key={dept.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200 hover:-translate-y-1"
              style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
              {/* Card top accent */}
              <div className="h-1.5 w-full" style={{background:\`linear-gradient(135deg,\${["#1d4ed8","#7c3aed","#059669","#dc2626","#d97706"][i%5]},\${["#3b82f6","#8b5cf6","#10b981","#ef4444","#f59e0b"][i%5]})\`}} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg text-white flex-shrink-0"
                      style={{background:\`linear-gradient(135deg,\${["#1d4ed8","#7c3aed","#059669","#dc2626","#d97706"][i%5]},\${["#3b82f6","#8b5cf6","#10b981","#ef4444","#f59e0b"][i%5]})\`}}>
                      {dept.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{dept.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Created {new Date(dept.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={\`text-xs px-2.5 py-1 rounded-full font-bold \${dept.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                    {dept.status === 'active' ? '● Active' : '● Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{background:"#f8fafc"}}>
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black text-gray-900">{dept._count?.employees || 0}</p>
                    <p className="text-xs text-gray-400 font-medium">Employees</p>
                  </div>
                  {(dept._count?.employees || 0) === 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-400 font-medium">Empty</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleViewDetail(dept)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all text-white"
                    style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                    View Members
                  </button>
                  {canManage && (<>
                    <button onClick={() => openEditModal(dept)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all">
                      Edit
                    </button>
                    <button onClick={() => handleToggleStatus(dept)}
                      className={\`px-3 py-2 rounded-xl text-xs font-bold transition-all \${dept.status === 'active' ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}\`}>
                      {dept.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </>)}
                </div>
              </div>
            </div>
          ))}`
);

// 5. Redesign success toast
c = c.replace(
  `        <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          ✅ {success}
        </div>`,
  `        <div className="fixed top-6 right-6 text-white px-5 py-3.5 rounded-2xl z-50 text-sm font-bold" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 25px rgba(16,185,129,0.4)"}}>
          ✅ {success}
        </div>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
