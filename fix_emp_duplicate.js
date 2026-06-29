const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/employees/employees.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Add duplicate email check before creating user
content = content.replace(
  "        const newUser = await this.prisma.user.create({",
  "        const existingUser = await this.prisma.user.findFirst({ where: { email: dto.email } });\n        if (existingUser) throw new BadRequestException('An employee with this email already exists');\n        const newUser = await this.prisma.user.create({"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');