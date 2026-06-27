const fs = require('fs');

// Update withAuth.tsx to add permission helper functions
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/lib/withAuth.tsx';
let content = fs.readFileSync(file, 'utf8');

const helpers = [
  '// Permission helper - checks if user has a specific permission',
  'export const hasPermission = (user: any, module: string, action: string): boolean => {',
  '  // COMPANY_ADMIN and HR_MANAGER have all permissions',
  '  if (!user) return false;',
  '  if (user.role === "COMPANY_ADMIN" || user.role === "HR_MANAGER") return true;',
  '  // If no custom permissions, use role-based defaults',
  '  if (!user.permissions) {',
  '    if (user.role === "DEPT_MANAGER") {',
  '      const deptManagerPerms: Record<string, string[]> = {',
  '        employees: ["view", "create", "edit_basic"],',
  '        attendance: ["view", "manage"],',
  '        leaves: ["view", "approve"],',
  '        departments: ["view"],',
  '        reports: ["view"],',
  '      };',
  '      return deptManagerPerms[module]?.includes(action) || false;',
  '    }',
  '    if (user.role === "EMPLOYEE") {',
  '      const employeePerms: Record<string, string[]> = {',
  '        attendance: ["view"],',
  '        leaves: ["view"],',
  '        payroll: ["view"],',
  '        reports: ["view"],',
  '        documents: ["view"],',
  '      };',
  '      return employeePerms[module]?.includes(action) || false;',
  '    }',
  '    return false;',
  '  }',
  '  // Custom role permissions',
  '  return user.permissions[module]?.[action] === true;',
  '};',
  '',
  '// Shorthand permission checkers',
  'export const canViewEmployees = (user: any) => hasPermission(user, "employees", "view");',
  'export const canCreateEmployee = (user: any) => hasPermission(user, "employees", "create");',
  'export const canEditEmployee = (user: any) => hasPermission(user, "employees", "edit_basic") || hasPermission(user, "employees", "edit_full");',
  'export const canDeleteEmployee = (user: any) => hasPermission(user, "employees", "delete");',
  'export const canViewSalary = (user: any) => hasPermission(user, "employees", "edit_salary") || user?.role === "COMPANY_ADMIN" || user?.role === "HR_MANAGER";',
  'export const canViewAttendance = (user: any) => hasPermission(user, "attendance", "view");',
  'export const canManageAttendance = (user: any) => hasPermission(user, "attendance", "manage");',
  'export const canViewLeaves = (user: any) => hasPermission(user, "leaves", "view");',
  'export const canApproveLeave = (user: any) => hasPermission(user, "leaves", "approve");',
  'export const canManageLeaves = (user: any) => hasPermission(user, "leaves", "manage");',
  'export const canViewPayroll = (user: any) => hasPermission(user, "payroll", "view");',
  'export const canViewPayrollSalary = (user: any) => hasPermission(user, "payroll", "view_salary");',
  'export const canProcessPayroll = (user: any) => hasPermission(user, "payroll", "process");',
  'export const canApprovePayroll = (user: any) => hasPermission(user, "payroll", "approve");',
  'export const canViewReports = (user: any) => hasPermission(user, "reports", "view");',
  'export const canViewDepartments = (user: any) => hasPermission(user, "departments", "view");',
  'export const canManageDocs = (user: any) => hasPermission(user, "documents", "upload");',
  'export const canDeleteDocs = (user: any) => hasPermission(user, "documents", "delete");',
].join('\n');

// Add helpers at end of file before last export
content = content + '\n' + helpers + '\n';
fs.writeFileSync(file, content, 'utf8');
console.log('withAuth.tsx updated!');