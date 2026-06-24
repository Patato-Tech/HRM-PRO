const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Redesign header
c = c.replace(
  `      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">
            {employees.length} total employees
          </p>
        </div>`,
  `      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 Employees</h1>
          <p className="text-gray-500 text-sm mt-1">{employees.length} total employees across all departments</p>
        </div>`
);

// 2. Redesign stats cards
c = c.replace(
  `        ].map((s, i) => (
          <div key={i} className={\`\${s.bg} rounded-2xl p-4 text-center\`}>
            <p className={\`text-3xl font-bold \${s.color}\`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}`,
  `        ].map((s, i) => (
          <div key={i} className={\`\${s.bg} rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow\`}>
            <p className={\`text-2xl font-extrabold \${s.color}\`}>{s.value}</p>
            <p className="text-xs font-medium text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}`
);

// 3. Redesign filters section
c = c.replace(
  `      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">`,
  `      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 items-center">`
);

// 4. Redesign table header
c = c.replace(
  `            <thead className="bg-gray-50 border-b border-gray-100">`,
  `            <thead className="bg-gradient-to-r from-blue-600 to-blue-700">`
);
c = c.replace(
  `                    className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"`,
  `                    className="text-left px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider"`
);

// 5. Fix duplicate active option
c = c.replace(
  `            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="active">Active</option>`,
  `            <option value="all">All Status</option>
            <option value="active">Active</option>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
