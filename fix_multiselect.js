const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Change state from single to array
c = c.replace(
  "const [deptFilter2, setDeptFilter2] = useState('all');\n  const [roleFilter, setRoleFilter] = useState('all');",
  "const [deptFilter2, setDeptFilter2] = useState([]);\n  const [roleFilter, setRoleFilter] = useState([]);\n  const [showDeptDropdown, setShowDeptDropdown] = useState(false);\n  const [showRoleDropdown, setShowRoleDropdown] = useState(false);"
);

// 2. Update filter logic in table
c = c.replaceAll(
  "if (deptFilter2 !== 'all') filtered = filtered.filter((e) => String(e.departmentId) === String(deptFilter2));",
  "if (deptFilter2.length > 0) filtered = filtered.filter((e) => deptFilter2.includes(String(e.departmentId)));"
);
c = c.replaceAll(
  "if (roleFilter !== 'all') filtered = filtered.filter((e) => e.user?.role === roleFilter);",
  "if (roleFilter.length > 0) filtered = filtered.filter((e) => roleFilter.includes(e.user?.role));"
);

// 3. Replace dept select with multi-select dropdown
c = c.replace(
  `                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Department</label>
                    <select value={deptFilter2} onChange={e => setDeptFilter2(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="all">All Departments</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>`,
  `                  <div className="relative">
                    <label className="text-xs text-gray-500 mb-1 block">Department</label>
                    <button type="button" onClick={() => { setShowDeptDropdown(!showDeptDropdown); setShowRoleDropdown(false); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                      <span>{deptFilter2.length === 0 ? 'All Departments' : deptFilter2.length + ' selected'}</span>
                      <span className="text-gray-400">▼</span>
                    </button>
                    {showDeptDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-2 max-h-48 overflow-y-auto">
                        <button type="button" onClick={() => setDeptFilter2([])}
                          className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg mb-1">Clear all</button>
                        {departments.map((d) => (
                          <label key={d.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input type="checkbox" checked={deptFilter2.includes(String(d.id))}
                              onChange={e => setDeptFilter2(prev => e.target.checked ? [...prev, String(d.id)] : prev.filter(x => x !== String(d.id)))}
                              className="rounded" />
                            <span className="text-sm text-gray-700">{d.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>`
);

// 4. Replace role select with multi-select dropdown
c = c.replace(
  `                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Role</label>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="all">All Roles</option>
                      <option value="COMPANY_ADMIN">Company Admin</option>
                      <option value="HR_MANAGER">HR Manager</option>
                      <option value="DEPT_MANAGER">Dept Manager</option>
                      <option value="EMPLOYEE">Employee</option>
                    </select>
                  </div>`,
  `                  <div className="relative">
                    <label className="text-xs text-gray-500 mb-1 block">Role</label>
                    <button type="button" onClick={() => { setShowRoleDropdown(!showRoleDropdown); setShowDeptDropdown(false); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between">
                      <span>{roleFilter.length === 0 ? 'All Roles' : roleFilter.length + ' selected'}</span>
                      <span className="text-gray-400">▼</span>
                    </button>
                    {showRoleDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-2">
                        <button type="button" onClick={() => setRoleFilter([])}
                          className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg mb-1">Clear all</button>
                        {[{v:'COMPANY_ADMIN',l:'Company Admin'},{v:'HR_MANAGER',l:'HR Manager'},{v:'DEPT_MANAGER',l:'Dept Manager'},{v:'EMPLOYEE',l:'Employee'}].map(r => (
                          <label key={r.v} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input type="checkbox" checked={roleFilter.includes(r.v)}
                              onChange={e => setRoleFilter(prev => e.target.checked ? [...prev, r.v] : prev.filter(x => x !== r.v))}
                              className="rounded" />
                            <span className="text-sm text-gray-700">{r.l}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done! Lines: " + c.split("\n").length);
