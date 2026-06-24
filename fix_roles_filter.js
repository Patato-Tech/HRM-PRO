const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx";
let c = fs.readFileSync(file, "utf8");

c = c.replace(
  `                        {[{v:'COMPANY_ADMIN',l:'Company Admin'},{v:'HR_MANAGER',l:'HR Manager'},{v:'DEPT_MANAGER',l:'Dept Manager'},{v:'EMPLOYEE',l:'Employee'}].map(r => (
                          <label key={r.v} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input type="checkbox" checked={roleFilter.includes(r.v)}
                              onChange={e => setRoleFilter(prev => e.target.checked ? [...prev, r.v] : prev.filter(x => x !== r.v))}
                              className="rounded" />
                            <span className="text-sm text-gray-700">{r.l}</span>
                          </label>
                        ))}`,
  `                        {[
                          { v: 'EMPLOYEE', l: 'Employee' },
                          ...Array.from(new Set(empReportData.filter((e) => e.customRole?.name).map((e) => e.customRole.name)))
                            .map((name) => ({ v: name, l: name }))
                        ].map(r => (
                          <label key={r.v} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input type="checkbox" checked={roleFilter.includes(r.v)}
                              onChange={e => setRoleFilter(prev => e.target.checked ? [...prev, r.v] : prev.filter(x => x !== r.v))}
                              className="rounded" />
                            <span className="text-sm text-gray-700">{r.l}</span>
                          </label>
                        ))}`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
