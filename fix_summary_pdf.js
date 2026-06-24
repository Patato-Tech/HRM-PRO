const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx";
let c = fs.readFileSync(file, "utf8");

// Add jsPDF import if not already there
if (!c.includes("import jsPDF")) {
  c = c.replace(
    "import { apiCall, getToken } from '@/lib/api';",
    "import { apiCall, getToken } from '@/lib/api';\nimport jsPDF from 'jspdf';\nimport autoTable from 'jspdf-autotable';"
  );
}

// Replace summary PDF button
const oldSummary = `        }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
          📄 Download Summary PDF
        </button>`;

const newSummary = `          const doc = new jsPDF();
          doc.setFontSize(16); doc.setTextColor(30,64,175);
          doc.text("HR Summary Report", 14, 18);
          doc.setFontSize(9); doc.setTextColor(100,100,100);
          doc.text("Generated: " + new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(), 14, 25);
          let y = 32;
          doc.setFontSize(11); doc.setTextColor(30,64,175);
          doc.text("Attendance Summary (Today)", 14, y); y += 6;
          autoTable(doc, { startY: y, head: [["Present","Absent","Late","Half Day","On Leave","Total"]], body: [[attendanceSummary?.present??0, attendanceSummary?.absent??0, attendanceSummary?.late??0, (attendanceSummary as any)?.halfDay??0, (attendanceSummary as any)?.onLeave??0, attendanceSummary?.totalEmployees??0]], headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9} });
          y = (doc as any).lastAutoTable.finalY + 8;
          doc.setFontSize(11); doc.setTextColor(30,64,175);
          doc.text("Leave Summary", 14, y); y += 6;
          autoTable(doc, { startY: y, head: [["Total","Pending","Approved","Rejected"]], body: [[leavesArr.length, leavesArr.filter((l:any)=>l.status==="pending").length, leavesArr.filter((l:any)=>l.status==="approved").length, leavesArr.filter((l:any)=>l.status==="rejected").length]], headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9} });
          y = (doc as any).lastAutoTable.finalY + 8;
          doc.setFontSize(11); doc.setTextColor(30,64,175);
          doc.text("Payroll Summary", 14, y); y += 6;
          autoTable(doc, { startY: y, head: [["Total Records","Paid Amount","Pending Amount","Pending Count"]], body: [[paySum.totalRecords??0, "PKR "+Number(paySum.paidAmount??0).toLocaleString(), "PKR "+Number(paySum.pendingAmount??0).toLocaleString(), paySum.pendingCount??0]], headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9} });
          y = (doc as any).lastAutoTable.finalY + 8;
          doc.setFontSize(11); doc.setTextColor(30,64,175);
          doc.text("Headcount by Department", 14, y); y += 6;
          autoTable(doc, { startY: y, head: [["Department","Employees"]], body: deptsArr.map((d:any)=>[d.name, empsArr.filter((e:any)=>String(e.departmentId)===String(d.id)).length]), headStyles:{fillColor:[30,64,175],fontSize:9}, bodyStyles:{fontSize:9} });
          doc.save("HR_Summary_Report_" + new Date().toISOString().split("T")[0] + ".pdf");
        }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
          📄 Download Summary PDF
        </button>`;

// Find the old button end and replace
c = c.replace(
  `          win.document.close();
          setTimeout(() => win.print(), 500);
        }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
          📄 Download Summary PDF
        </button>`,
  newSummary
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
