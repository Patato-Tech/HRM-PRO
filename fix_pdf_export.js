const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx";
let c = fs.readFileSync(file, "utf8");

// Add jsPDF import at top
c = c.replace(
  "import { apiCall, getToken } from '@/lib/api';",
  "import { apiCall, getToken } from '@/lib/api';\nimport jsPDF from 'jspdf';\nimport autoTable from 'jspdf-autotable';"
);

// Replace the export button onClick
c = c.replace(
  `                  <button onClick={() => {
                    let filtered = empReportData;
                    if (activeTab === 'joiners') filtered = filtered.filter((e) => e.status === 'active' || e.status === 'sabbatical');
                    if (activeTab === 'leavers') filtered = filtered.filter((e) => e.status === 'resigned' || e.status === 'terminated');
                    if (activeTab === 'current') filtered = filtered.filter((e) => e.status === 'active' || e.status === 'sabbatical');
                    if (deptFilter2.length > 0) filtered = filtered.filter((e) => deptFilter2.includes(String(e.departmentId)));
                    if (roleFilter.length > 0) filtered = filtered.filter((e) => roleFilter.includes(e.customRole?.name || (e.user?.role === 'EMPLOYEE' ? 'Employee' : '')));
                    if (activeTab === 'joiners' && dateFrom) filtered = filtered.filter((e) => new Date(e.joinDate) >= new Date(dateFrom));
                    if (activeTab === 'joiners' && dateTo) filtered = filtered.filter((e) => new Date(e.joinDate) <= new Date(dateTo));
                    const title = activeTab === 'joiners' ? 'Joiners Report' : activeTab === 'leavers' ? 'Leavers Report' : 'Current Employees Report';
                    const rows = filtered.map(emp => \`<tr>
                      <td>\${emp.user?.name || '-'}</td>
                      <td>\${emp.user?.email || '-'}</td>
                      <td>\${emp.employeeCode}</td>
                      <td>\${emp.department?.name || '-'}</td>
                      <td>\${emp.customRole?.name || emp.user?.role?.replace(/_/g, ' ') || '-'}</td>
                      <td>\${emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}</td>
                      <td>\${new Date(emp.joinDate).toLocaleDateString()}</td>
                    </tr>\`).join('');
                    const win = window.open('', '_blank');
                    if (!win) return;
                    win.document.write(\`<!DOCTYPE html><html><head><title>\${title}</title>
                    <style>body{font-family:Arial;padding:30px;color:#111}h1{color:#1e40af;margin-bottom:4px}p.sub{color:#666;font-size:13px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#1e40af;color:white;padding:10px 12px;text-align:left;font-size:12px}td{padding:9px 12px;border-bottom:1px solid #eee;font-size:13px}tr:nth-child(even){background:#f9fafb}.footer{margin-top:20px;font-size:12px;color:#999;border-top:1px solid #eee;padding-top:10px}</style>
                    </head><body>
                    <h1>\${title}</h1>
                    <p class="sub">Company: \${user?.companyName || '-'} &nbsp;|&nbsp; Generated: \${new Date().toLocaleDateString()} \${new Date().toLocaleTimeString()} &nbsp;|&nbsp; Total: \${filtered.length} employees</p>
                    <table><thead><tr><th>Name</th><th>Email</th><th>Code</th><th>Department</th><th>Role</th><th>Status</th><th>Join Date</th></tr></thead>
                    <tbody>\${rows}</tbody></table>
                    <div class="footer">HRMPro Enterprise &nbsp;|&nbsp; Confidential</div>
                    </body></html>\`);
                    win.document.close();
                    setTimeout(() => win.print(), 500);
                  }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                    📄 Export PDF
                  </button>`,
  `                  <button onClick={() => {
                    let filtered = empReportData;
                    if (activeTab === 'joiners') filtered = filtered.filter((e) => e.status === 'active' || e.status === 'sabbatical');
                    if (activeTab === 'leavers') filtered = filtered.filter((e) => e.status === 'resigned' || e.status === 'terminated');
                    if (activeTab === 'current') filtered = filtered.filter((e) => e.status === 'active' || e.status === 'sabbatical');
                    if (deptFilter2.length > 0) filtered = filtered.filter((e) => deptFilter2.includes(String(e.departmentId)));
                    if (roleFilter.length > 0) filtered = filtered.filter((e) => roleFilter.includes(e.customRole?.name || (e.user?.role === 'EMPLOYEE' ? 'Employee' : '')));
                    if (activeTab === 'joiners' && dateFrom) filtered = filtered.filter((e) => new Date(e.joinDate) >= new Date(dateFrom));
                    if (activeTab === 'joiners' && dateTo) filtered = filtered.filter((e) => new Date(e.joinDate) <= new Date(dateTo));
                    const title = activeTab === 'joiners' ? 'Joiners Report' : activeTab === 'leavers' ? 'Leavers Report' : 'Current Employees Report';
                    const doc = new jsPDF();
                    doc.setFontSize(16);
                    doc.setTextColor(30, 64, 175);
                    doc.text(title, 14, 20);
                    doc.setFontSize(9);
                    doc.setTextColor(100, 100, 100);
                    doc.text('Company: ' + (user?.companyName || '-') + '   |   Generated: ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() + '   |   Total: ' + filtered.length + ' employees', 14, 28);
                    autoTable(doc, {
                      startY: 34,
                      head: [['Name', 'Email', 'Code', 'Department', 'Role', 'Status', 'Join Date']],
                      body: filtered.map(emp => [
                        emp.user?.name || '-',
                        emp.user?.email || '-',
                        emp.employeeCode,
                        emp.department?.name || '-',
                        emp.customRole?.name || emp.user?.role?.replace(/_/g, ' ') || '-',
                        emp.status.charAt(0).toUpperCase() + emp.status.slice(1),
                        new Date(emp.joinDate).toLocaleDateString()
                      ]),
                      headStyles: { fillColor: [30, 64, 175], fontSize: 9 },
                      bodyStyles: { fontSize: 9 },
                      alternateRowStyles: { fillColor: [249, 250, 251] },
                    });
                    doc.save(title.replace(/ /g, '_') + '_' + new Date().toISOString().split('T')[0] + '.pdf');
                  }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                    📄 Export PDF
                  </button>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
