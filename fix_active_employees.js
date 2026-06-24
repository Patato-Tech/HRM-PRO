const fs = require("fs");

// ATTENDANCE - filter employees in mark modal dropdown
let file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/attendance/page.tsx";
let c = fs.readFileSync(file, "utf8");
c = c.replaceAll(
  ".filter(\n                      (emp) =>\n                        !markForm.departmentId ||\n                        String(emp.departmentId) ===\n                          String(markForm.departmentId),\n                    )",
  ".filter((emp) => emp.status === \"active\" && (!markForm.departmentId || String(emp.departmentId) === String(markForm.departmentId)))"
);
// Also fix bulk attendance
c = c.replace(
  "employees.map((emp) => (",
  "employees.filter((emp: any) => emp.status === \"active\").map((emp) => ("
);
fs.writeFileSync(file, c, "utf8");
console.log("Attendance done!");

// LEAVES - filter employees dropdown
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/leaves/page.tsx";
c = fs.readFileSync(file, "utf8");
c = c.replace(
  "{employees.map((emp) => (",
  "{employees.filter((emp: any) => emp.status === \"active\").map((emp) => ("
);
fs.writeFileSync(file, c, "utf8");
console.log("Leaves done!");

// PAYROLL - filter employees in all dropdowns
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/payroll/page.tsx";
c = fs.readFileSync(file, "utf8");
// Add active filter to employee dropdown
c = c.replace(
  "{employees.filter((emp: any) => deptFilter === \"all\" || String(emp.departmentId) === String(deptFilter)).map((emp: any) => (",
  "{employees.filter((emp: any) => emp.status === \"active\" && (deptFilter === \"all\" || String(emp.departmentId) === String(deptFilter))).map((emp: any) => ("
);
// Add active filter to bulk process
c = c.replace(
  "const unprocessed = employees.filter((emp: any) => !payrolls.some((p: any) => String(p.employee?.id) === String(emp.id) && p.month === monthFilter && p.year === yearFilter));",
  "const unprocessed = employees.filter((emp: any) => emp.status === \"active\" && !payrolls.some((p: any) => String(p.employee?.id) === String(emp.id) && p.month === monthFilter && p.year === yearFilter));"
);
fs.writeFileSync(file, c, "utf8");
console.log("Payroll done!");

// PERFORMANCE - filter employees dropdown
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/performance/page.tsx";
c = fs.readFileSync(file, "utf8");
c = c.replace(
  "{employees.map((emp) => (",
  "{employees.filter((emp: any) => emp.status === \"active\").map((emp) => ("
);
fs.writeFileSync(file, c, "utf8");
console.log("Performance done!");

// RECRUITMENT - already job based, no employee dropdown needed
// TRAINING - filter employees enrollment dropdown  
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/training/page.tsx";
c = fs.readFileSync(file, "utf8");
c = c.replace(
  "{employees.map((emp) => (",
  "{employees.filter((emp: any) => emp.status === \"active\").map((emp) => ("
);
fs.writeFileSync(file, c, "utf8");
console.log("Training done!");

// DOCUMENTS - filter employees dropdown
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/documents/page.tsx";
c = fs.readFileSync(file, "utf8");
c = c.replace(
  "{employees.map((emp) => (",
  "{employees.filter((emp: any) => emp.status === \"active\").map((emp) => ("
);
fs.writeFileSync(file, c, "utf8");
console.log("Documents done!");
