const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add permission imports
content = content.replace(
  "import { useAuth, canManageEmployees",
  "import { useAuth, canManageEmployees, canCreateEmployee, canEditEmployee, canDeleteEmployee, canViewSalary"
);

// If different import format
if (!content.includes('canCreateEmployee')) {
  content = content.replace(
    "} from '@/lib/withAuth';",
    ", canCreateEmployee, canEditEmployee, canDeleteEmployee, canViewSalary } from '@/lib/withAuth';"
  );
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');