const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/attendance/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix fetchByDate - replace setRecords(data) with filtered version
content = content.replace(
  '      const data = await apiCall(/attendance/date/, {}, token);\n      setRecords(data);',
  '      const data = await apiCall(/attendance/date/, {}, token);\n      const isOwnDeptDate = user?.customRoleScope === "own_department" && user?.departmentId;\n      setRecords(isOwnDeptDate ? (data || []).filter((r) => String(r.employee?.departmentId) === String(user.departmentId)) : (data || []));'
);

// Also fix the main fetchData setEmployees and setRecords
content = content.replace(
  '      setEmployees(empData);\n      setRecords(recordsData);',
  '      const isOwnDeptAtt = user?.customRoleScope === "own_department" && user?.departmentId;\n      setEmployees(isOwnDeptAtt ? (empData || []).filter((e) => String(e.departmentId) === String(user.departmentId)) : (empData || []));\n      setRecords(isOwnDeptAtt ? (recordsData || []).filter((r) => String(r.employee?.departmentId) === String(user.departmentId)) : (recordsData || []));'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done! File size: ' + content.length);