const fs = require('fs');

const pages = [
  'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/attendance/page.tsx',
  'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/leaves/page.tsx',
  'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx',
  'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/payroll/page.tsx',
  'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx',
  'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/documents/page.tsx',
  'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/profile/page.tsx',
];

let totalFixed = 0;
pages.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Replace raw status display with capitalized version
  // Pattern: {something.status} -> {something.status.charAt(0).toUpperCase() + something.status.slice(1)}
  content = content.replace(/\{([a-zA-Z_.?]+)\.status\}/g, (match, obj) => {
    // Skip if it's in an attribute/prop context (has = before it nearby)
    return '{' + obj + '.status ? ' + obj + '.status.charAt(0).toUpperCase() + ' + obj + '.status.slice(1) : "—"}';
  });

  if (content !== original) {
    const matches = (original.match(/\{([a-zA-Z_.?]+)\.status\}/g) || []).length;
    totalFixed += matches;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed ' + matches + ' in ' + file.split('/').pop());
  }
});
console.log('Total fixed: ' + totalFixed);