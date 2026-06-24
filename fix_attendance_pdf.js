const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Fix weekly print button to async + jsPDF
c = c.replace(
  `                      <button onClick={() => {
                        const selectedDay = new Date(reportWeek);`,
  `                      <button onClick={async () => {
                        const { default: jsPDF } = await import('jspdf');
                        const { default: autoTable } = await import('jspdf-autotable');
                        const selectedDay = new Date(reportWeek);`
);
c = c.replace(
  `                        win.document.write(\`<!DOCTYPE html><html><head><title>Weekly Report</title><style>body{font-family:Arial;padding:30px}h1{color:#1e40af}table{width:100%;border-collapse:collapse}th{background:#1e40af;color:white;padding:10px;text-align:left}td{padding:8px;border-bottom:1px solid #eee}</style></head><body><h1>Weekly Attendance Report</h1><p>Week: \${monday.toLocaleDateString()} - \${sunday.toLocaleDateString()}</p><br><table><tr><th>Employee</th><th>Code</th><th>Present</th><th>Late</th><th>Half Day</th><th>On Leave</th><th>Absent</th></tr>\${rows}</table></body></html>\`);
                        win.document.close();
                        setTimeout(() => win.print(), 500);
                      }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium self-end">
                        🖨️ Print Report
                      </button>`,
  `                        const doc = new jsPDF();
                        doc.setFontSize(14); doc.setTextColor(30,64,175);
                        doc.text("Weekly Attendance Report", 14, 18);
                        doc.setFontSize(9); doc.setTextColor(100,100,100);
                        doc.text("Week: " + monday.toLocaleDateString() + " - " + sunday.toLocaleDateString() + "   |   Generated: " + new Date().toLocaleDateString(), 14, 25);
                        autoTable(doc, { startY: 30, head: [["Employee","Code","Present","Late","Half Day","On Leave","Absent"]], body: employees.map((emp) => { const empRecs2 = monthlyAttendance.filter((r) => { const d = new Date(r.date); return String(r.employeeId) === String(emp.id) && d >= monday && d <= sunday; }); return [emp.user.name, emp.employeeCode, empRecs2.filter(r=>r.status==="present").length, empRecs2.filter(r=>r.status==="late").length, empRecs2.filter(r=>r.status==="half_day").length, empRecs2.filter(r=>r.status==="on_leave").length, Math.max(0,6-empRecs2.filter(r=>r.status==="present").length-empRecs2.filter(r=>r.status==="late").length-empRecs2.filter(r=>r.status==="half_day").length-empRecs2.filter(r=>r.status==="on_leave").length)]; }), headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9}, alternateRowStyles:{fillColor:[249,250,251]} });
                        doc.save("Weekly_Attendance_" + monday.toISOString().split("T")[0] + ".pdf");
                      }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium self-end">
                        📄 Export PDF
                      </button>`
);

// 2. Fix monthly print button to async + jsPDF
c = c.replace(
  `                      <button onClick={() => {
                        const win = window.open('', '_blank');
                        const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];`,
  `                      <button onClick={async () => {
                        const { default: jsPDF } = await import('jspdf');
                        const { default: autoTable } = await import('jspdf-autotable');
                        const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];`
);
c = c.replace(
  `                        win.document.write(\`<!DOCTYPE html><html><head><title>Attendance Report</title><style>body{font-family:Arial;padding:30px}h1{color:#1e40af}table{width:100%;border-collapse:collapse}th{background:#1e40af;color:#fff;padding:10px;text-align:left}td{padding:8px;border-bottom:1px solid #eee}tr:nth-child(even) td{background:#f9fafb}@media print{@page{margin:10mm}}</style></head><body><h1>Attendance Report — \${MONTHS[reportMonth-1]} \${reportYear}</h1><p style="color:#6b7280">Generated: \${new Date().toLocaleDateString()}</p><br><table><tr><th>Employee</th><th>Code</th><th>Present</th><th>Late</th><th>Half Day</th><th>Absent</th><th>Rate</th></tr>\${rows}</table></body></html>\`);
                        win.document.close();
                        setTimeout(() => win.print(), 500);
                      }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                        🖨️ Print Report
                      </button>`,
  `                        const doc = new jsPDF();
                        doc.setFontSize(14); doc.setTextColor(30,64,175);
                        doc.text("Attendance Report — " + MONTHS[reportMonth-1] + " " + reportYear, 14, 18);
                        doc.setFontSize(9); doc.setTextColor(100,100,100);
                        doc.text("Generated: " + new Date().toLocaleDateString(), 14, 25);
                        autoTable(doc, { startY: 30, head: [["Employee","Code","Present","Late","Half Day","Absent","Rate"]], body: employees.map((emp) => { const empRecs3 = monthlyAttendance.filter((r) => String(r.employeeId) === String(emp.id)); const p=empRecs3.filter(r=>r.status==="present").length; const l=empRecs3.filter(r=>r.status==="late").length; const h=empRecs3.filter(r=>r.status==="half_day").length; const a=empRecs3.filter(r=>r.status==="absent").length; const t=p+l+h+a; const rate=t>0?Math.round(((p+l)/t)*100):0; return [emp.user.name, emp.employeeCode, p, l, h, a, rate+"%"]; }), headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9}, alternateRowStyles:{fillColor:[249,250,251]} });
                        doc.save("Monthly_Attendance_" + MONTHS[reportMonth-1] + "_" + reportYear + ".pdf");
                      }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                        📄 Export PDF
                      </button>`
);

// 3. Fix daily print button
c = c.replace(
  `                    <button onClick={() => { window.print(); }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                      🖨️ Print Report
                    </button>`,
  `                    <button onClick={async () => {
                      const { default: jsPDF } = await import('jspdf');
                      const { default: autoTable } = await import('jspdf-autotable');
                      const doc = new jsPDF();
                      doc.setFontSize(14); doc.setTextColor(30,64,175);
                      doc.text("Daily Attendance Report", 14, 18);
                      doc.setFontSize(9); doc.setTextColor(100,100,100);
                      doc.text("Date: " + attendanceDate + "   |   Generated: " + new Date().toLocaleDateString(), 14, 25);
                      autoTable(doc, { startY: 30, head: [["Employee","Code","Status","Check In","Check Out"]], body: attendanceRecords.map(r => [r.employee?.user?.name||"-", r.employee?.employeeCode||"-", r.status, r.checkIn ? new Date(r.checkIn).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—", r.checkOut ? new Date(r.checkOut).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—"]), headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9}, alternateRowStyles:{fillColor:[249,250,251]} });
                      doc.save("Daily_Attendance_" + attendanceDate + ".pdf");
                    }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                      📄 Export PDF
                    </button>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
