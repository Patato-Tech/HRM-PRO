const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/employees/employees.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Add email import
content = content.replace(
  "import { checkPermission, getEmployeeScopeFilter, canViewSalary, isSelfOperation } from '../auth/rbac.util';",
  "import { checkPermission, getEmployeeScopeFilter, canViewSalary, isSelfOperation } from '../auth/rbac.util';\nimport { EmailService } from '../email/email.service';"
);

// Fix constructor
content = content.replace(
  "constructor(private prisma: PrismaService) { }",
  "constructor(private prisma: PrismaService, private emailService: EmailService) { }"
);

// Add welcome email after employee creation
content = content.replace(
  "include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },\n        });\n        return employee;\n    }\n    async update",
  "include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },\n        });\n        try {\n            const company = await this.prisma.company.findUnique({ where: { id: companyId } });\n            await this.emailService.sendWelcome(dto.email, dto.name, company?.name || 'HRMPro', dto.role || 'EMPLOYEE', dto.password);\n        } catch (e) { console.error('Welcome email failed:', e.message); }\n        return employee;\n    }\n    async update"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Step 1 done!');