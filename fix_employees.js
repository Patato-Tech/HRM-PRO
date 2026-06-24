const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Redesign header
c = c.replace(
  `      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 Employees</h1>
          <p className="text-gray-500 text-sm mt-1">{employees.length} total employees across all departments</p>
        </div>`,
  `      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Employees</h1>
          <p className="text-gray-400 text-sm mt-0.5">{employees.length} total employees across all departments</p>
        </div>`
);

// 2. Redesign buttons
c = c.replace(
  `            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            📄 Export PDF
          </button>`,
  `            className="text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 4px 12px rgba(16,185,129,0.3)"}}
          >
            📄 Export PDF
          </button>`
);

c = c.replace(
  `            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            + Add Employee
          </button>`,
  `            className="text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}
          >
            + Add Employee
          </button>`
);

c = c.replace(
  `            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            📥 Import CSV
          </button>`,
  `            className="text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{background:"linear-gradient(135deg,#7c3aed,#8b5cf6)",boxShadow:"0 4px 12px rgba(139,92,246,0.3)"}}
          >
            📥 Import CSV
          </button>`
);

// 3. Redesign stat cards
c = c.replace(
  `        ].map((s, i) => (
          <div key={i} className={\`\${s.bg} rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow\`}>
            <p className={\`text-2xl font-extrabold \${s.color}\`}>{s.value}</p>
            <p className="text-xs font-medium text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}`,
  `        ].map((s, i) => (
          <div key={i} className={\`\${s.bg} rounded-2xl p-4 border border-white cursor-default\`}
            style={{boxShadow:"0 2px 10px rgba(0,0,0,0.06)",transition:"all 0.2s"}}
            onMouseEnter={e => (e.currentTarget.style.transform="translateY(-2px)")}
            onMouseLeave={e => (e.currentTarget.style.transform="translateY(0)")}>
            <p className={\`text-3xl font-black \${s.color}\`}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}`
);

// 4. Redesign filters
c = c.replace(
  `      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            placeholder="Search by name, email, code, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
            <option value="sabbatical">Sabbatical</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>`,
  `      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100" style={{boxShadow:"0 2px 10px rgba(0,0,0,0.04)"}}>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email, code, designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
            <option value="sabbatical">Sabbatical</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>`
);

// 5. Redesign table
c = c.replace(
  `            <thead className="bg-gradient-to-r from-blue-600 to-blue-700">`,
  `            <thead>`
);
c = c.replace(
  `                    className="text-left px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider"`,
  `                    className="text-left px-5 py-3.5 text-xs font-black text-slate-300 uppercase tracking-widest"
                    style={{background:"linear-gradient(135deg,#0f172a,#1e293b)"}}`
);

// 6. Redesign success toast
c = c.replace(
  `        <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          ✅ {success}
        </div>`,
  `        <div className="fixed top-6 right-6 text-white px-5 py-3.5 rounded-2xl z-50 text-sm font-bold flex items-center gap-2" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 25px rgba(16,185,129,0.4)"}}>
          ✅ {success}
        </div>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
