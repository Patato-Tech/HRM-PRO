const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/platform/platform.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace sendCompanyApproved with sendActivationEmail + OTP
content = content.replace(
  "        try {\n            const admin = await this.prisma.user.findFirst({ where: { companyId: id, role: \"COMPANY_ADMIN\" } });\n            if (admin) await this.emailService.sendCompanyApproved(admin.email, admin.name, company.name);\n        } catch (e) { console.error(\"Approval email failed:\", e.message); }",
  "        try {\n            const admin = await this.prisma.user.findFirst({ where: { companyId: id, role: 'COMPANY_ADMIN' } });\n            if (admin) {\n                const otp = Math.floor(100000 + Math.random() * 900000).toString();\n                await this.prisma.oTP.create({ data: { email: admin.email, otp, purpose: 'Account Activation', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });\n                await this.emailService.sendActivationEmail(admin.email, admin.name, company.name, 'Check your registration details', otp);\n            }\n        } catch (e) { console.error('Approval email failed:', e.message); }"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');