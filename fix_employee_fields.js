const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/backend/src/employees/employees.service.ts";
let content = fs.readFileSync(file, "utf8");

// Fix single employee create - add phone, cnic, gender, employmentType
content = content.replace(
  "data: { companyId, userId: newUser.id, employeeCode, designation: dto.designation, departmentId: deptId, salary, roleId, joinDate: dto.joinDate ? new Date(dto.joinDate) : new Date() },",
  "data: { companyId, userId: newUser.id, employeeCode, designation: dto.designation, departmentId: deptId, salary, roleId, joinDate: dto.joinDate ? new Date(dto.joinDate) : new Date(), phone: dto.phone || null, cnic: dto.cnic || null, gender: dto.gender || null, employmentType: dto.employmentType || 'full_time' },"
);

// Fix bulk import - add phone, cnic, gender, employmentType
content = content.replace(
  'data: { companyId, userId: newUser.id, employeeCode, designation: emp.designation || "", departmentId: deptId, salary: Number(emp.salary || 0), joinDate: emp.joinDate ? new Date(emp.joinDate) : new Date() },',
  'data: { companyId, userId: newUser.id, employeeCode, designation: emp.designation || "", departmentId: deptId, salary: Number(emp.salary || 0), joinDate: emp.joinDate ? new Date(emp.joinDate) : new Date(), phone: emp.phone || null, cnic: emp.cnic || null, gender: emp.gender || null, employmentType: emp.employmentType || "full_time" },'
);

// Fix update - add phone, cnic, gender, employmentType
content = content.replace(
  "data: {\n                designation: canEditFull ? dto.designation : undefined,\n                departmentId: canEditFull ? (deptId !== undefined ? deptId : null) : undefined,\n                salary: canEditSalary ? dto.salary : undefined,\n                status: canEditFull ? dto.status : undefined,\n                roleId: isAdmin ? updateRoleId : undefined,\n            },",
  "data: {\n                designation: canEditFull ? dto.designation : undefined,\n                departmentId: canEditFull ? (deptId !== undefined ? deptId : null) : undefined,\n                salary: canEditSalary ? dto.salary : undefined,\n                status: canEditFull ? dto.status : undefined,\n                roleId: isAdmin ? updateRoleId : undefined,\n                phone: canEditFull ? (dto.phone || null) : undefined,\n                cnic: canEditFull ? (dto.cnic || null) : undefined,\n                gender: canEditFull ? (dto.gender || null) : undefined,\n                employmentType: canEditFull ? (dto.employmentType || undefined) : undefined,\n            },"
);

fs.writeFileSync(file, content, "utf8");
console.log("Done! Create:", content.includes("phone: dto.phone"), "Update:", content.includes("phone: canEditFull"));