const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `        if (employeeId) {
          const [ownAttendance, ownLeaves] = await Promise.allSettled([
            apiCall(\`/attendance/employee/\${employeeId}\`, {}, token),
            apiCall(\`/leaves/employee/\${employeeId}\`, {}, token),
          ]);
          // No company stats for plain employees
        }`;

const newBlock = `        if (employeeId) {
          const [ownAttendance, ownLeaves, ownBalance] = await Promise.allSettled([
            apiCall(\`/attendance/employee/\${employeeId}\`, {}, token),
            apiCall(\`/leaves/employee/\${employeeId}\`, {}, token),
            apiCall(\`/leaves/balance/\${employeeId}\`, {}, token),
          ]);
          if (ownAttendance.status === "fulfilled") {
            const todayStr = new Date().toISOString().split("T")[0];
            const todayRec = (ownAttendance.value || []).find((r) => r.date && r.date.split("T")[0] === todayStr);
            setMyTodayAttendance(todayRec || null);
          }
          if (ownLeaves.status === "fulfilled") {
            setMyRecentLeaves((ownLeaves.value || []).slice(0, 5));
          }
          if (ownBalance.status === "fulfilled") {
            setMyLeaveBalance(ownBalance.value || []);
          }
        }`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Replaced successfully!');
} else {
  console.log('Block not found - no changes made');
}
