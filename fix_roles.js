const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/roles/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Redesign success toast
c = c.replace(
  `      {success && <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">✅ {success}</div>}`,
  `      {success && <div className="fixed top-6 right-6 text-white px-5 py-3.5 rounded-2xl z-50 text-sm font-bold" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 25px rgba(16,185,129,0.4)"}}>✅ {success}</div>}`
);

// 2. Redesign header
c = c.replace(
  `      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-500 text-sm mt-1">{roles.length} custom roles · Only Company Admin can manage roles</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
          + Create Role
        </button>
      </div>`,
  `      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Roles & Permissions</h1>
          <p className="text-gray-400 text-sm mt-0.5">{roles.length} custom roles · Only Company Admin can manage roles</p>
        </div>
        <button onClick={openCreate}
          className="text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>
          + Create Role
        </button>
      </div>`
);

// 3. Redesign empty state
c = c.replace(
  `        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">🎭</p>
          <p className="text-gray-900 font-semibold mb-1">No custom roles yet</p>
          <p className="text-gray-400 text-sm mb-4">Create roles to assign specific permissions to employees</p>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium">+ Create First Role</button>
        </div>`,
  `        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🎭</div>
          <p className="text-gray-900 font-black text-lg mb-1">No custom roles yet</p>
          <p className="text-gray-400 text-sm mb-4">Create roles to assign specific permissions to employees</p>
          <button onClick={openCreate} className="text-white px-4 py-2 rounded-xl text-sm font-bold"
            style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>+ Create First Role</button>
        </div>`
);

// 4. Redesign role cards
c = c.replace(
  `            <div key={role.id} onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
              className={\`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all shadow-sm hover:shadow-md \${selectedRole?.id === role.id ? 'border-blue-500' : 'border-gray-100'}\`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                      {role.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-gray-900">{role.name}</h3>
                  </div>
                  {role.description && <p className="text-xs text-gray-400 mt-1 ml-10">{role.description}</p>}
                </div>
                <span className={\`text-xs px-2 py-0.5 rounded-full font-medium \${role.scope === 'all' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}\`}>
                  {role.scope === 'all' ? 'All Depts' : 'Own Dept'}
                </span>
              </div>`,
  `            <div key={role.id} onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
              className="bg-white rounded-2xl cursor-pointer transition-all overflow-hidden"
              style={{border: selectedRole?.id === role.id ? "2px solid #3b82f6" : "2px solid #f1f5f9", boxShadow: selectedRole?.id === role.id ? "0 4px 20px rgba(59,130,246,0.2)" : "0 2px 10px rgba(0,0,0,0.05)"}}>
              <div className="h-1.5 w-full" style={{background:\`linear-gradient(135deg,\${["#1d4ed8","#7c3aed","#059669","#dc2626","#d97706"][roles.indexOf(role)%5]},\${["#3b82f6","#8b5cf6","#10b981","#ef4444","#f59e0b"][roles.indexOf(role)%5]})\`}} />
              <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white"
                      style={{background:\`linear-gradient(135deg,\${["#1d4ed8","#7c3aed","#059669","#dc2626","#d97706"][roles.indexOf(role)%5]},\${["#3b82f6","#8b5cf6","#10b981","#ef4444","#f59e0b"][roles.indexOf(role)%5]})\`}}>
                      {role.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-black text-gray-900">{role.name}</h3>
                  </div>
                  {role.description && <p className="text-xs text-gray-400 mt-1 ml-11">{role.description}</p>}
                </div>
                <span className={\`text-xs px-2.5 py-1 rounded-full font-bold \${role.scope === 'all' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}\`}>
                  {role.scope === 'all' ? 'All Depts' : 'Own Dept'}
                </span>
              </div>`
);

// 5. Fix closing div for card
c = c.replace(
  `              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400">{role._count?.employees || 0} employees</span>
                <div className="flex gap-1.5">
                  <button onClick={e => { e.stopPropagation(); openEdit(role); }}
                    className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg">Edit</button>


                </div>
              </div>
            </div>`,
  `              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-400">{role._count?.employees || 0} employees</span>
                <div className="flex gap-1.5">
                  <button onClick={e => { e.stopPropagation(); openEdit(role); }}
                    className="text-xs font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition-all">Edit</button>
                </div>
              </div>
              </div>
            </div>`
);

// 6. Redesign permission detail panel
c = c.replace(
  `        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">{selectedRole.name} — Permissions</h2>
              <p className="text-xs text-gray-400 mt-0.5">Scope: {selectedRole.scope === 'all' ? 'All Departments' : 'Own Department Only'}</p>
            </div>
            <button onClick={() => setSelectedRole(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>`,
  `        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
          <div className="p-5 border-b border-gray-100 flex items-center justify-between" style={{background:"linear-gradient(135deg,#f8fafc,#f1f5f9)"}}>
            <div>
              <h2 className="font-black text-gray-900 text-lg">{selectedRole.name} — Permissions</h2>
              <p className="text-xs text-gray-400 mt-0.5">Scope: {selectedRole.scope === 'all' ? 'All Departments' : 'Own Department Only'}</p>
            </div>
            <button onClick={() => setSelectedRole(null)} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-all">✕</button>
          </div>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
