const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/employees/employees.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "            include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },\n        });\n    }\n    async update",
  "            include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },\n        });\n        try {\n            const company = await this.prisma.company.findUnique({ where: { id: companyId } });\n            await this.emailService.sendWelcome(dto.email, dto.name, company?.name || 'HRMPro', dto.role || 'EMPLOYEE', dto.password);\n        } catch (e) { console.error('Welcome email failed:', e.message); }\n        return employee;\n    }\n    async update"
);

// Fix the return - need to store employee first
content = content.replace(
  "        return this.prisma.employee.create({",
  "        const employee = await this.prisma.employee.create({"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');