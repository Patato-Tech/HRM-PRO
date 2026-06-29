const fs = require("fs");
const lf = "C:/Users/aghaa/Desktop/HRM PRO/backend/src/leaves/leaves.service.ts";
let l = fs.readFileSync(lf, "utf8");

l = l.replace(
  'await this.emailService.sendLeaveStatus(ea.user.email, ea.user.name, leave.leaveType, new Date(leave.startDate).toDateString(), new Date(leave.endDate).toDateString(), "Approved");',
  'await this.emailService.sendLeaveStatus(ea.user.email, ea.user.name, "Approved", leave.leaveType, new Date(leave.startDate).toDateString() + " - " + new Date(leave.endDate).toDateString());'
);

l = l.replace(
  'await this.emailService.sendLeaveStatus(er.user.email, er.user.name, leave.leaveType, new Date(leave.startDate).toDateString(), new Date(leave.endDate).toDateString(), "Rejected");',
  'await this.emailService.sendLeaveStatus(er.user.email, er.user.name, "Rejected", leave.leaveType, new Date(leave.startDate).toDateString() + " - " + new Date(leave.endDate).toDateString());'
);

fs.writeFileSync(lf, l, "utf8");
console.log("Done!");