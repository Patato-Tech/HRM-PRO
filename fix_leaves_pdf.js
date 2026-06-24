const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Add Export PDF to Leaves tab
c = c.replace(
  `                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                  <p className="font-semibold text-gray-900 flex-1">Leave Records</p>
                  <select
                    value={leaveFilter}
                    onChange={e => setLeaveFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>`,
  `                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                  <p className="font-semibold text-gray-900 flex-1">Leave Records</p>
                  <button onClick={async () => {
                    const { default: jsPDF } = await import('jspdf');
                    const { default: autoTable } = await import('jspdf-autotable');
                    const doc = new jsPDF();
                    doc.setFontSize(14); doc.setTextColor(30,64,175);
                    doc.text("Leave Records Report", 14, 18);
                    doc.setFontSize(9); doc.setTextColor(100,100,100);
                    doc.text("Generated: " + new Date().toLocaleDateString() + "   |   Total: " + filteredLeaves.length + " records", 14, 25);
                    autoTable(doc, { startY: 30, head: [["Employee","Leave Type","Days","Status"]], body: filteredLeaves.map(l => [l.employee?.user?.name||"-", l.leaveType, l.days, l.status]), headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9}, alternateRowStyles:{fillColor:[249,250,251]} });
                    doc.save("Leave_Records_" + new Date().toISOString().split("T")[0] + ".pdf");
                  }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm font-medium">
                    📄 Export PDF
                  </button>
                  <select
                    value={leaveFilter}
                    onChange={e => setLeaveFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
