const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/attendance/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');
// Line 253 is index 252 (setRecords(data))
lines.splice(253, 1, 
  '      const isOwnDeptDate = user?.customRoleScope === "own_department" && user?.departmentId;',
  '      setRecords(isOwnDeptDate ? (data || []).filter((r) => String(r.employee?.departmentId) === String(user.departmentId)) : (data || []));'
);
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Done! Lines: ' + lines.length);