const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Fix stat cards grid - single row
c = c.replace(
  '<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">',
  '<div className="grid grid-cols-4 lg:grid-cols-8 gap-3">'
);

// 2. Reduce stat card padding
c = c.replace(
  `style={{boxShadow:"0 2px 10px rgba(0,0,0,0.06)",transition:"all 0.2s"}}`,
  `style={{boxShadow:"0 2px 8px rgba(0,0,0,0.05)",transition:"all 0.2s"}}`
);
c = c.replace(
  '<p className={"text-3xl font-black ' + '" + s.color + '"}>{s.value}</p>',
  '<p className={"text-2xl font-black ' + '" + s.color + '"}>{s.value}</p>'
);

// 3. Add hover to table rows
c = c.replace(
  '<tbody className="divide-y divide-gray-50">',
  '<tbody className="divide-y divide-gray-100">'
);

// 4. Add styles for table rows
c = c.replace(
  '<div className="space-y-6">',
  `<div className="space-y-5">
      <style>{\`
        .emp-row { transition: all 0.15s ease; }
        .emp-row:hover { background: #f8faff !important; }
        .action-btn-sm { transition: all 0.15s ease; }
        .action-btn-sm:hover { transform: translateY(-1px); }
      \`}</style>`
);

// 5. Add emp-row class to table rows
c = c.replaceAll(
  '<tr key={emp.id} className="hover:bg-gray-50">',
  '<tr key={emp.id} className="emp-row">'
);

// 6. Improve employee avatar with gradient
c = c.replace(
  `<div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                      {emp.user.name.charAt(0).toUpperCase()}
                    </div>`,
  `<div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white" style={{background:\`linear-gradient(135deg,\${["#1d4ed8","#7c3aed","#059669","#dc2626","#d97706"][parseInt(emp.id)%5]},\${["#3b82f6","#8b5cf6","#10b981","#ef4444","#f59e0b"][parseInt(emp.id)%5]})\`}}>
                      {emp.user.name.charAt(0).toUpperCase()}
                    </div>`
);

// 7. Improve action buttons
c = c.replace(
  `<button onClick={() => setShowViewModal && openViewModal(emp)} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg font-medium">View</button>`,
  `<button onClick={() => setShowViewModal && openViewModal(emp)} className="action-btn-sm text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl">View</button>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
