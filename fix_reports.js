const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Update ReportTab type
c = c.replace(
  "type ReportTab = 'attendance' | 'leaves' | 'payroll' | 'headcount';",
  "type ReportTab = 'attendance' | 'leaves' | 'payroll' | 'headcount' | 'joiners' | 'leavers' | 'current';"
);

// 2. Add state for new reports
c = c.replace(
  "const [loading, setLoading] = useState(false);",
  "const [loading, setLoading] = useState(false);\n  const [empReportData, setEmpReportData] = useState([]);\n  const [dateFrom, setDateFrom] = useState('');\n  const [dateTo, setDateTo] = useState('');\n  const [deptFilter2, setDeptFilter2] = useState('all');\n  const [roleFilter, setRoleFilter] = useState('all');"
);

// 3. Add fetch logic for new tabs
c = c.replace(
  "} else if (tab === 'headcount') {",
  "} else if (tab === 'joiners' || tab === 'leavers' || tab === 'current') {\n        const emps = await apiCall('/employees', {}, token);\n        setEmpReportData(emps || []);\n      } else if (tab === 'headcount') {"
);

// 4. Add new tabs to navigation
c = c.replace(
  "{ key: 'headcount' as ReportTab, label: '👥 Headcount' },",
  "{ key: 'headcount' as ReportTab, label: '👥 Headcount' },\n    { key: 'joiners' as ReportTab, label: '🟢 Joiners' },\n    { key: 'leavers' as ReportTab, label: '🔴 Leavers' },\n    { key: 'current' as ReportTab, label: '👤 Current' },"
);

fs.writeFileSync(file, c, "utf8");
console.log("Step 1 done! Lines: " + c.split("\n").length);
