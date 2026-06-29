const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/platform/platform.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Add email import
content = content.replace(
  "import * as bcrypt from 'bcryptjs';",
  "import * as bcrypt from 'bcryptjs';\nimport { EmailService } from '../email/email.service';"
);

// Add emailService to constructor
content = content.replace(
  "constructor(private prisma: PrismaService, private jwtService: JwtService) { }",
  "constructor(private prisma: PrismaService, private jwtService: JwtService, private emailService: EmailService) { }"
);

// Add email after approve
content = content.replace(
  "await this.prisma.company.update({ where: { id }, data: { status: 'active' } });\n        return { message:",
  "await this.prisma.company.update({ where: { id }, data: { status: 'active' } });\n        try {\n            const admin = await this.prisma.user.findFirst({ where: { companyId: id, role: 'COMPANY_ADMIN' } });\n            if (admin) await this.emailService.sendCompanyApproved(admin.email, admin.name, company.name);\n        } catch (e) { console.error('Approval email failed:', e.message); }\n        return { message:"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');