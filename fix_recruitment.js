const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/recruitment/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Find setJobs line (index 89)
lines.splice(89, 1,
  '      const isOwnDeptRec = user?.customRoleScope === "own_department" && user?.departmentId;',
  '      setJobs(isOwnDeptRec ? (jobsData || []).filter((j) => String(j.departmentId) === String(user.departmentId)) : (jobsData || []));'
);
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Recruitment done!');