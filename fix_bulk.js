const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/attendance/page.tsx";
let content = fs.readFileSync(file, "utf8");
const old = "        checkIn: \"09:00\",\n        checkOut: \"17:00\",";
const neu = "        checkIn: shift ? shift.shiftStart : \"09:00\",\n        checkOut: shift ? shift.shiftEnd : \"17:00\",";
let result = content.replace(old, neu);
// Add shift lookup before employees.forEach inside initBulkForms
result = result.replace(
  "    const availableShifts = shiftData || shifts;\n    const forms",
  "    const availableShifts = shiftData || shifts;\n    const companyShift = availableShifts.find((s) => !s.departmentId);\n    const forms"
);
result = result.replace(
  "    employees.forEach((emp) => {\n      forms[emp.id] = {",
  "    employees.forEach((emp) => {\n      const deptShift = availableShifts.find((s) => s.departmentId && String(s.departmentId) === String(emp.departmentId));\n      const shift = deptShift || companyShift;\n      forms[emp.id] = {"
);
console.log(result !== content ? "Fixed!" : "NO MATCH");
fs.writeFileSync(file, result, "utf8");
