const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/backend/src/platform/platform.service.ts";
let content = fs.readFileSync(file, "utf8");
content = content.replace(
  "adminName: string; adminEmail: string; adminPassword: string;",
  "adminName: string; adminEmail: string; adminPassword: string; adminPhone?: string; adminDesignation?: string; adminCnic?: string;"
);
content = content.replace(
  "data: { name: dto.adminName, email: dto.adminEmail, passwordHash: hashedPassword, role: 'COMPANY_ADMIN', companyId: company.id }",
  "data: { name: dto.adminName, email: dto.adminEmail, passwordHash: hashedPassword, role: 'COMPANY_ADMIN', companyId: company.id, phone: dto.adminPhone || null, designation: dto.adminDesignation || null, cnic: dto.adminCnic || null }"
);
fs.writeFileSync(file, content, "utf8");
console.log("Done!");