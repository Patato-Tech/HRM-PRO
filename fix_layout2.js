const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/layout.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Add useEffect import
c = c.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';");

// 2. Add activeModules state
c = c.replace(
  "const [sidebarOpen, setSidebarOpen] = useState(false);",
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModules, setActiveModules] = useState({});
  useEffect(() => {
    const loadModules = () => {
      const companyId = localStorage.getItem('user_companyId');
      const saved = localStorage.getItem('company_modules_' + companyId);
      if (saved) setActiveModules(JSON.parse(saved));
      else setActiveModules({ recruitment: true, training: true, performance: true, documents: true, roles: true });
    };
    loadModules();
    window.addEventListener('modules_updated', loadModules);
    return () => window.removeEventListener('modules_updated', loadModules);
  }, []);
);

// 3. Update visibleNav
c = c.replace(
  "return isAllowed(item.roles);\n  });",
  if (isAdmin) return isAllowed(item.roles);
    const OPTIONAL = ['recruitment', 'training', 'performance', 'documents', 'roles'];
    const moduleKey = item.href.replace('/dashboard/', '');
    if (OPTIONAL.includes(moduleKey) && activeModules[moduleKey] === false) return false;
    return isAllowed(item.roles);
  });
);

fs.writeFileSync(file, c, 'utf8');
console.log('Done!');
