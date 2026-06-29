const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/leaves/leaves.service.ts';
const lines = fs.readFileSync(file, 'utf8').split('\n');

// Add email before return updated (line 173, 0-indexed 172)
lines[172] = "        try { const emp = await this.prisma.employee.findFirst({ where: { id: leave.employeeId }, include: { user: true } }); if (emp) await this.emailService.sendLeaveStatus(emp.user.email, emp.user.name, leave.leaveType, new Date(leave.startDate).toDateString(), new Date(leave.endDate).toDateString(), 'Approved'); } catch (e) { console.error('Leave email failed:', e.message); }";
lines[173] = "        return updated;";

// Fix reject to store result and send email
lines[179] = "        const rejUpdated = await this.prisma.leave.update({";
lines[182] = "            data: { status: 'rejected' },";
lines[183] = "        });";
lines[184] = "        try { const emp = await this.prisma.employee.findFirst({ where: { id: leave.employeeId }, include: { user: true } }); if (emp) await this.emailService.sendLeaveStatus(emp.user.email, emp.user.name, leave.leaveType, new Date(leave.startDate).toDateString(), new Date(leave.endDate).toDateString(), 'Rejected'); } catch (e) { console.error('Leave email failed:', e.message); }";
lines[185] = "        return rejUpdated;";
lines[186] = "    }";

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Done!');