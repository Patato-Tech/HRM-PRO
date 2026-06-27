const fs = require('fs');

// Fix performance page - lines 89-90 (index 88-89)
let file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/performance/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');
lines.splice(88, 2,
  '      const isOwnDeptPerf = user?.customRoleScope === "own_department" && user?.departmentId;',
  '      setReviews(isOwnDeptPerf ? (reviewsData || []).filter((r) => String(r.employee?.departmentId) === String(user.departmentId)) : (reviewsData || []));',
  '      setEmployees(isOwnDeptPerf ? (empsData || []).filter((e) => String(e.departmentId) === String(user.departmentId)) : (empsData || []));'
);
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Performance done!');

// Fix training page - lines 78 (index 77)
file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/training/page.tsx';
lines = fs.readFileSync(file, 'utf8').split('\n');
lines.splice(77, 1,
  '      const isOwnDeptTrn = user?.customRoleScope === "own_department" && user?.departmentId;',
  '      setEmployees(isOwnDeptTrn ? (empsData || []).filter((e) => String(e.departmentId) === String(user.departmentId)) : (empsData || []));'
);
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Training done!');

// Departments page - no filter needed (company-wide view is OK for dept managers)
console.log('All done!');