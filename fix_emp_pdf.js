const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx";
let c = fs.readFileSync(file, "utf8");

// Add jsPDF import
c = c.replace(
  "import { apiCall, getToken } from '@/lib/api';",
  "import { apiCall, getToken } from '@/lib/api';\nimport jsPDF from 'jspdf';\nimport autoTable from 'jspdf-autotable';"
);

// Replace export button onClick
const oldBtn = `            onClick={() => {
              const canSeeSalary =
                user?.role === "COMPANY_ADMIN" || user?.role === "HR_MANAGER";
              const win = window.open("", "_blank");
              if (!win) return;
              const rows = employees
                .map(
                  (emp) => \`<tr>
              <td>\${emp.user.name}</td>
              <td>\${emp.employeeCode}</td>
              <td>\${emp.designation || "-"}</td>
              <td>\${emp.department?.name || "Company Wide"}</td>
              <td>\${emp.customRole?.name || emp.user.role?.replace(/_/g, " ")}</td>
              <td>\${emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}</td>
              \${canSeeSalary ? \`<td>PKR \${Number(emp.salary).toLocaleString()}</td>\` : ""}
            </tr>\`,
                )
                .join("");
              const salaryHeader = canSeeSalary ? "<th>Salary</th>" : "";
              win.document.write(
                \`<!DOCTYPE html><html><head><title>Employees Report</title><style>body{font-family:Arial;padding:30px;color:#111}h1{color:#1e40af;margin-bottom:4px}p{color:#666;font-size:13px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#1e40af;color:white;padding:10px 12px;text-align:left;font-size:12px}td{padding:9px 12px;border-bottom:1px solid #eee;font-size:13px}tr:nth-child(even){background:#f9fafb}.footer{margin-top:20px;font-size:12px;color:#666}</style></head><body><h1>Employee Report</h1><p>\${user?.companyName || "Company"} &nbsp;|&nbsp; Generated: \${new Date().toLocaleDateString()}</p><table><thead><tr><th>Name</th><th>Code</th><th>Designation</th><th>Department</th><th>Role</th><th>Status</th>\${salaryHeader}</tr></thead><tbody>\${rows}</tbody></table><div class="footer">Total Employees: \${employees.length}</div></body></html>\`,
              );
              win.document.close();
              setTimeout(() => win.print(), 500);
            }}`;

const newBtn = `            onClick={() => {
              const canSeeSalary = user?.role === "COMPANY_ADMIN" || user?.role === "HR_MANAGER";
              const doc = new jsPDF();
              doc.setFontSize(16);
              doc.setTextColor(30, 64, 175);
              doc.text("Employee Report", 14, 20);
              doc.setFontSize(9);
              doc.setTextColor(100, 100, 100);
              doc.text("Company: " + (user?.companyName || "-") + "   |   Generated: " + new Date().toLocaleDateString() + "   |   Total: " + employees.length + " employees", 14, 28);
              const cols = ["Name", "Code", "Designation", "Department", "Role", "Status", ...(canSeeSalary ? ["Salary"] : [])];
              const rows = employees.map(emp => [
                emp.user.name,
                emp.employeeCode,
                emp.designation || "-",
                emp.department?.name || "Company Wide",
                emp.customRole?.name || emp.user.role?.replace(/_/g, " "),
                emp.status.charAt(0).toUpperCase() + emp.status.slice(1),
                ...(canSeeSalary ? ["PKR " + Number(emp.salary).toLocaleString()] : [])
              ]);
              autoTable(doc, {
                startY: 34,
                head: [cols],
                body: rows,
                headStyles: { fillColor: [30, 64, 175], fontSize: 9 },
                bodyStyles: { fontSize: 9 },
                alternateRowStyles: { fillColor: [249, 250, 251] },
              });
              doc.save("Employee_Report_" + new Date().toISOString().split("T")[0] + ".pdf");
            }}`;

c = c.replace(oldBtn, newBtn);
fs.writeFileSync(file, c, "utf8");
console.log(c.includes("jsPDF") ? "Done!" : "Import not added");
