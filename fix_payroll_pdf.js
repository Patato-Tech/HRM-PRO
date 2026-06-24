const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx";
let c = fs.readFileSync(file, "utf8");

c = c.replace(
  `                <div className="p-5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-gray-900 flex-1">Monthly Payroll</p>`,
  `                <div className="p-5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-gray-900 flex-1">Monthly Payroll</p>
                  <button onClick={async () => {
                    const { default: jsPDF } = await import('jspdf');
                    const { default: autoTable } = await import('jspdf-autotable');
                    const doc = new jsPDF();
                    doc.setFontSize(14); doc.setTextColor(30,64,175);
                    doc.text("Payroll Report — " + MONTH_NAMES[payrollMonth-1] + " " + payrollYear, 14, 18);
                    doc.setFontSize(9); doc.setTextColor(100,100,100);
                    doc.text("Generated: " + new Date().toLocaleDateString() + "   |   Total: " + payrollRecords.length + " records", 14, 25);
                    autoTable(doc, { startY: 30, head: [["Employee","Basic","Allowances","Deductions","Net Salary","Status"]], body: payrollRecords.map(p => [p.employee?.user?.name||"-", "PKR "+Number(p.basic).toLocaleString(), "PKR "+Number(p.allowances).toLocaleString(), "PKR "+Number(p.deductions).toLocaleString(), "PKR "+Number(p.netSalary).toLocaleString(), p.status]), headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9}, alternateRowStyles:{fillColor:[249,250,251]} });
                    doc.save("Payroll_" + MONTH_NAMES[payrollMonth-1] + "_" + payrollYear + ".pdf");
                  }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm font-medium">
                    📄 Export PDF
                  </button>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
