const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/backend/src/employees/employees.service.ts";
let content = fs.readFileSync(file, "utf8");

// Fix update - just insert new fields before the closing }
content = content.replace(
  "                roleId: isAdmin ? updateRoleId : undefined,\n            },",
  "                roleId: isAdmin ? updateRoleId : undefined,\n                phone: canEditFull ? (dto.phone || null) : undefined,\n                cnic: canEditFull ? (dto.cnic || null) : undefined,\n                gender: canEditFull ? (dto.gender || null) : undefined,\n                employmentType: canEditFull ? (dto.employmentType || undefined) : undefined,\n            },"
);

fs.writeFileSync(file, content, "utf8");
console.log("Update fixed:", content.includes("phone: canEditFull"));