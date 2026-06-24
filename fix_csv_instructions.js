const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx";
let c = fs.readFileSync(file, "utf8");

c = c.replace(
  `                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-5 border border-blue-100">
                    <p className="text-sm font-bold text-blue-800 mb-2">
                      📋 CSV Format
                    </p>
                    <p className="text-xs text-blue-700 font-mono bg-white rounded-lg px-3 py-2 border border-blue-100">
                      Name, Email, Password, Designation, Department, Salary, Phone, CNIC, Gender, EmploymentType, CustomRole
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-blue-600">
                      <p>• CustomRole: name of a role from your Roles page (optional, leave blank for default Employee)</p>
                      <p>• Gender: male, female, other</p>
                      <p>• EmploymentType: full_time, part_time, contract, intern</p>
                      <p>• Department: required if using a department-scoped custom role</p>
                    </div>`,
  `                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-5 border border-blue-100">
                    <p className="text-sm font-black text-blue-800 mb-3">📋 How to Import Employees</p>
                    <div className="space-y-2 mb-4">
                      {[
                        { step: "1", text: "Download the CSV template using the button below" },
                        { step: "2", text: "Open in Excel or Google Sheets" },
                        { step: "3", text: "Fill in employee details row by row (do not change headers)" },
                        { step: "4", text: "Save as CSV format and upload the file" },
                        { step: "5", text: "Review the data, fix errors, then click Import" },
                      ].map((s, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">{s.step}</span>
                          <p className="text-xs text-blue-700">{s.text}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-blue-800 mb-1">📄 Column Reference:</p>
                    <p className="text-xs text-blue-700 font-mono bg-white rounded-lg px-3 py-2 border border-blue-100 mb-3">
                      Name, Email, Password, Designation, Department, Salary, Phone, CNIC, Gender, EmploymentType, CustomRole
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-blue-600 mb-3">
                      <p>• <b>Name, Email, Password</b> — required</p>
                      <p>• <b>Department</b> — optional (blank = Company Wide)</p>
                      <p>• <b>Salary</b> — number only e.g. 50000</p>
                      <p>• <b>Gender</b> — male, female, other</p>
                      <p>• <b>EmploymentType</b> — full_time, part_time, contract, intern</p>
                      <p>• <b>CustomRole</b> — must exist in Roles page (optional)</p>
                    </div>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
