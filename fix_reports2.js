const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx";
let c = fs.readFileSync(file, "utf8");

const newContent = `
          {(activeTab === 'joiners' || activeTab === 'leavers' || activeTab === 'current') && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-900 mb-4">
                  {activeTab === 'joiners' ? '🟢 List of Joiners' : activeTab === 'leavers' ? '🔴 List of Leavers' : '👤 Current Employees'}
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {activeTab === 'joiners' && (<>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">From Date</label>
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">To Date</label>
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </>)}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Department</label>
                    <select value={deptFilter2} onChange={e => setDeptFilter2(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="all">All Departments</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Role</label>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="all">All Roles</option>
                      <option value="COMPANY_ADMIN">Company Admin</option>
                      <option value="HR_MANAGER">HR Manager</option>
                      <option value="DEPT_MANAGER">Dept Manager</option>
                      <option value="EMPLOYEE">Employee</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Join Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(() => {
                        let filtered = empReportData;
                        if (activeTab === 'joiners') filtered = filtered.filter((e) => e.status === 'active' || e.status === 'sabbatical');
                        if (activeTab === 'leavers') filtered = filtered.filter((e) => e.status === 'resigned' || e.status === 'terminated');
                        if (activeTab === 'current') filtered = filtered.filter((e) => e.status === 'active' || e.status === 'sabbatical');
                        if (deptFilter2 !== 'all') filtered = filtered.filter((e) => String(e.departmentId) === String(deptFilter2));
                        if (roleFilter !== 'all') filtered = filtered.filter((e) => e.user?.role === roleFilter);
                        if (activeTab === 'joiners' && dateFrom) filtered = filtered.filter((e) => new Date(e.joinDate) >= new Date(dateFrom));
                        if (activeTab === 'joiners' && dateTo) filtered = filtered.filter((e) => new Date(e.joinDate) <= new Date(dateTo));
                        if (filtered.length === 0) return (
                          <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No employees found.</td></tr>
                        );
                        return filtered.map((emp) => (
                          <tr key={emp.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                                  {emp.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{emp.user?.name}</p>
                                  <p className="text-xs text-gray-400">{emp.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.employeeCode}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.department?.name || '—'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{emp.user?.role?.replace(/_/g, ' ')}</td>
                            <td className="px-6 py-4">
                              <span className={"text-xs px-2.5 py-1 rounded-full font-semibold " + (emp.status === 'active' ? 'bg-green-100 text-green-700' : emp.status === 'sabbatical' ? 'bg-blue-100 text-blue-700' : emp.status === 'resigned' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700')}>
                                {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(emp.joinDate).toLocaleDateString()}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}`;

c = c.replace(
  "        </>\n      )}\n    </div>\n  );\n}",
  "        </>\n      )}" + newContent + "\n    </div>\n  );\n}"
);

fs.writeFileSync(file, c, "utf8");
console.log("Done! Lines: " + c.split("\n").length);
