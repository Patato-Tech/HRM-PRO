const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx";
let content = fs.readFileSync(file, "utf8");

const oldBlock = `                <div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-5 border border-blue-100">
                    <p className="text-sm font-black text-blue-800 mb-3">📋 How to Import Employees</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">1</span><p className="text-xs text-blue-700">Download the CSV template using the button below</p></div>
                      <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">2</span><p className="text-xs text-blue-700">Open in Excel or Google Sheets — do NOT change column headers</p></div>
                      <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">3</span><p className="text-xs text-blue-700">Fill in employee details row by row starting from row 2</p></div>
                      <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">4</span><p className="text-xs text-blue-700">Save as CSV format then upload the file here</p></div>
                      <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">5</span><p className="text-xs text-blue-700">Review the data, fix any errors shown in red, then click Import</p></div>
                    </div>
                    <p className="text-xs font-bold text-blue-800 mb-1">📄 Column Reference:</p>
                    <p className="text-xs text-blue-700 font-mono bg-white rounded-lg px-3 py-2 border border-blue-100 mb-3">Name, Email, Password, Designation, Department, Salary, Phone, CNIC, Gender, EmploymentType, CustomRole</p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-blue-600">
                      <p>• Name, Email, Password — required</p>
                      <p>• Department — optional (blank = Company Wide)</p>
                      <p>• Salary — number only e.g. 50000</p>
                      <p>• Gender — male, female, other</p>
                      <p>• EmploymentType — full_time, part_time, contract, intern</p>
                      <p>• CustomRole — must exist in Roles page (optional)</p>
                      <p>• JoinDate — format YYYY-MM-DD, any past or future date (optional, defaults to today)</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-blue-700">
                        🏢 Available Departments:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {departments.map((d: any) => (
                          <span
                            key={d.id}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                          >
                            {d.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mb-5">
                    <button
                      onClick={() => {
                        const csv =
                          "Name,Email,Password,Designation,Department,Salary,Phone,CNIC,Gender,EmploymentType,CustomRole,JoinDate\\nSam Smith,sam@company.com,pass123,Developer,Hardware Department,50000,03001234567,12345-1234567-1,male,full_time,,2026-01-15";
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "employees_template.csv";
                        a.click();
                      }}
                      className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-green-200"
                    >
                      📄 Download Template
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-blue-300 transition-colors">
                    <div className="text-4xl mb-3">📂</div>
                    <p className="text-gray-700 font-semibold mb-1">
                      Upload your CSV file
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      Drag and drop or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {`;

console.log("Block found:", content.includes(oldBlock));