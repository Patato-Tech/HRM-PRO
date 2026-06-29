const fs = require("fs");

// EMPLOYEES - add welcome email
const empFile = "C:/Users/aghaa/Desktop/HRM PRO/backend/src/employees/employees.service.ts";
let emp = fs.readFileSync(empFile, "utf8");
emp = emp.replace(
  "        return this.prisma.employee.create({",
  "        const employee = await this.prisma.employee.create({"
);
emp = emp.replace(
  "            include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },\n        });\n    }\n    async update",
  "            include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },\n        });\n        try {\n            const co = await this.prisma.company.findUnique({ where: { id: companyId } });\n            await this.emailService.sendWelcome(dto.email, dto.name, co ? co.name : \"HRMPro\", \"EMPLOYEE\", dto.password);\n        } catch (e) { console.error(\"Welcome email failed:\", e.message); }\n        return employee;\n    }\n    async update"
);
fs.writeFileSync(empFile, emp, "utf8");
console.log("Employees done!");

// LEAVES - add leave status emails
const leafFile = "C:/Users/aghaa/Desktop/HRM PRO/backend/src/leaves/leaves.service.ts";
let leaf = fs.readFileSync(leafFile, "utf8");
leaf = leaf.replace(
  "        return updated;\n    }\n    async reject",
  "        try {\n            const ea = await this.prisma.employee.findFirst({ where: { id: leave.employeeId }, include: { user: true } });\n            if (ea) await this.emailService.sendLeaveStatus(ea.user.email, ea.user.name, leave.leaveType, new Date(leave.startDate).toDateString(), new Date(leave.endDate).toDateString(), \"Approved\");\n        } catch (e) { console.error(\"Leave email failed:\", e.message); }\n        return updated;\n    }\n    async reject"
);
leaf = leaf.replace(
  "        return this.prisma.leave.update({\n            where: { id },\n            data: { status: \"rejected\" },\n        });\n    }",
  "        const rej = await this.prisma.leave.update({\n            where: { id },\n            data: { status: \"rejected\" },\n        });\n        try {\n            const er = await this.prisma.employee.findFirst({ where: { id: leave.employeeId }, include: { user: true } });\n            if (er) await this.emailService.sendLeaveStatus(er.user.email, er.user.name, leave.leaveType, new Date(leave.startDate).toDateString(), new Date(leave.endDate).toDateString(), \"Rejected\");\n        } catch (e) { console.error(\"Leave email failed:\", e.message); }\n        return rej;\n    }"
);
fs.writeFileSync(leafFile, leaf, "utf8");
console.log("Leaves done!");