const fs = require('fs');

// Helper function to add dept scope filter
const addDeptFilter = (content, fetchVar, deptField) => {
  return content;
};

// FIX PAYROLL PAGE
let file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/payroll/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find where payroll records and employees are set
content = content.replace(
  /setPayrolls\(([^)]+)\);(\s*)setEmployees\(([^)]+)\);/g,
  (match, p1, ws, p2) => {
    return const isOwnDeptP = user?.customRoleScope === "own_department" && user?.departmentId;
      setPayrolls(isOwnDeptP ? ( || []).filter((r) => String(r.employee?.departmentId) === String(user.departmentId)) : ( || []));setEmployees(isOwnDeptP ? ( || []).filter((e) => String(e.departmentId) === String(user.departmentId)) : ( || []));;
  }
);
fs.writeFileSync(file, content, 'utf8');
console.log('Payroll done!');

// FIX REPORTS PAGE
file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /setEmployees\(([^)]+)\);/g,
  (match, p1) => {
    return const isOwnDeptR = user?.customRoleScope === "own_department" && user?.departmentId;
      setEmployees(isOwnDeptR ? ( || []).filter((e) => String(e.departmentId) === String(user.departmentId)) : ( || []));;
  }
);
fs.writeFileSync(file, content, 'utf8');
console.log('Reports done!');

// FIX DOCUMENTS PAGE
file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/documents/page.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /setEmployees\(([^)]+)\);/g,
  (match, p1) => {
    return const isOwnDeptD = user?.customRoleScope === "own_department" && user?.departmentId;
      setEmployees(isOwnDeptD ? ( || []).filter((e) => String(e.departmentId) === String(user.departmentId)) : ( || []));;
  }
);
content = content.replace(
  /setDocuments\(([^)]+)\);/g,
  (match, p1) => {
    return setDocuments(typeof isOwnDeptD !== 'undefined' && isOwnDeptD ? ( || []).filter((d) => String(d.employee?.departmentId) === String(user?.departmentId)) : ( || []));;
  }
);
fs.writeFileSync(file, content, 'utf8');
console.log('Documents done!');

console.log('All done!');