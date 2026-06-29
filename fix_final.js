const fs = require("fs");

// EMPLOYEES
const ef = "C:/Users/aghaa/Desktop/HRM PRO/backend/src/employees/employees.service.ts";
let e = fs.readFileSync(ef, "utf8").replace(/\r\n/g, "\n");
e = e.replace(
  "        return this.prisma.employee.create({",
  "        const employee = await this.prisma.employee.create({"
);
const eOld = "            include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },\n        });\n    }\n    async update";
const eNew = "            include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },\n        });\n        try {\n            const co = await this.prisma.company.findUnique({ where: { id: companyId } });\n            await this.emailService.sendWelcome(dto.email, dto.name, co ? co.name : \"HRMPro\", \"EMPLOYEE\", dto.password);\n        } catch (ex) { console.error(\"Welcome email failed:\", ex.message); }\n        return employee;\n    }\n    async update";
e = e.replace(eOld, eNew);
fs.writeFileSync(ef, e, "utf8");
console.log("Employees:", e.includes("return employee") ? "OK" : "FAILED");

// LEAVES
const lf = "C:/Users/aghaa/Desktop/HRM PRO/backend/src/leaves/leaves.service.ts";
let l = fs.readFileSync(lf, "utf8").replace(/\r\n/g, "\n");
const lOld = "        return updated;\n    }\n    async reject";
const lNew = "        try {\n            const ea = await this.prisma.employee.findFirst({ where: { id: leave.employeeId }, include: { user: true } });\n            if (ea) await this.emailService.sendLeaveStatus(ea.user.email, ea.user.name, leave.leaveType, new Date(leave.startDate).toDateString(), new Date(leave.endDate).toDateString(), \"Approved\");\n        } catch (ex) { console.error(\"Leave email failed:\", ex.message); }\n        return updated;\n    }\n    async reject";
l = l.replace(lOld, lNew);
const lOld2 = "        return this.prisma.leave.update({\n            where: { id },\n            data: { status: 'rejected' },\n        });\n    }";
const lNew2 = "        const rej = await this.prisma.leave.update({\n            where: { id },\n            data: { status: 'rejected' },\n        });\n        try {\n            const er = await this.prisma.employee.findFirst({ where: { id: leave.employeeId }, include: { user: true } });\n            if (er) await this.emailService.sendLeaveStatus(er.user.email, er.user.name, leave.leaveType, new Date(leave.startDate).toDateString(), new Date(leave.endDate).toDateString(), \"Rejected\");\n        } catch (ex) { console.error(\"Leave email failed:\", ex.message); }\n        return rej;\n    }";
l = l.replace(lOld2, lNew2);
fs.writeFileSync(lf, l, "utf8");
console.log("Leaves:", l.includes("sendLeaveStatus") ? "OK" : "FAILED");