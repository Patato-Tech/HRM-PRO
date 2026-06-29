const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/leaves/leaves.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Add emailService to constructor
content = content.replace(
  "constructor(private prisma: PrismaService) { }",
  "constructor(private prisma: PrismaService, private emailService: EmailService) { }"
);

// Add email after approve
content = content.replace(
  "data: { status: 'approved', approvedBy },\n        });",
  "data: { status: 'approved', approvedBy },\n        });\n        try {\n            const emp = await this.prisma.employee.findFirst({ where: { id: leave.employeeId }, include: { user: true } });\n            if (emp) await this.emailService.sendLeaveStatus(emp.user.email, emp.user.name, leave.leaveType, new Date(leave.startDate).toDateString(), new Date(leave.endDate).toDateString(), 'Approved');\n        } catch (e) { console.error('Leave email failed:', e.message); }"
);

// Add email after reject
content = content.replace(
  "data: { status: 'rejected' },\n        });\n    }",
  "data: { status: 'rejected' },\n        });\n        try {\n            const emp = await this.prisma.employee.findFirst({ where: { id: leave.employeeId }, include: { user: true } });\n            if (emp) await this.emailService.sendLeaveStatus(emp.user.email, emp.user.name, leave.leaveType, new Date(leave.startDate).toDateString(), new Date(leave.endDate).toDateString(), 'Rejected');\n        } catch (e) { console.error('Leave email failed:', e.message); }\n        return updated;\n    }"
);

// Store reject result
content = content.replace(
  "return this.prisma.leave.update({\n            where: { id },\n            data: { status: 'rejected' },",
  "const updated = await this.prisma.leave.update({\n            where: { id },\n            data: { status: 'rejected' },"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');