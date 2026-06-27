const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/payroll/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldSection =               {[
                { type: "LATE_ARRIVAL", label: "Late Arrival", icon: "⏰", desc: "Deduct % of daily salary per late arrival" },
                { type: "HALF_DAY", label: "Half Day", icon: "🌓", desc: "Deduct 50% of daily salary automatically" },
                { type: "UNAPPROVED_LEAVE", label: "Unapproved Leave", icon: "🌿", desc: "Deduct 1 day salary per unapproved leave day" },
              ].map(ruleType => {
                const existing = deductionRules.find(r => r.type === ruleType.type);
                const isActive = existing?.isActive || false;
                const percentage = existing?.deductPercentage || (ruleType.type === "LATE_ARRIVAL" ? 50 : ruleType.type === "HALF_DAY" ? 50 : 100);
                return (
                  <div key={ruleType.type} className={\ounded-xl p-4 border-2 transition-all \\}>                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ruleType.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{ruleType.label}</p>
                          <p className="text-xs text-gray-400">{ruleType.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {ruleType.type === "LATE_ARRIVAL" && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500">Deduct %:</label>
                            <input type="number" value={percentage} min="1" max="100"
                              onChange={e => {
                                const newRules = deductionRules.filter(r => r.type !== ruleType.type);
                                setDeductionRules([...newRules, { type: ruleType.type, deductPercentage: Number(e.target.value), isActive }]);
                              }}
                              className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        )}
                        <button onClick={() => {
                          const newRules = deductionRules.filter(r => r.type !== ruleType.type);
                          setDeductionRules([...newRules, { type: ruleType.type, deductPercentage: percentage, isActive: !isActive }]);
                        }} className={\elative inline-flex h-6 w-11 items-center rounded-full transition-colors \\}>
                          <span className={\inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform \\} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })};

const newSection =               {[
                { type: "LATE_ARRIVAL", label: "Late Arrival", icon: "⏰", color: "orange", desc: "Deduct % of daily salary per late check-in", integrated: "📅 Linked to Attendance", defaultPct: 50 },
                { type: "HALF_DAY", label: "Half Day", icon: "🌓", color: "blue", desc: "Deduct % of daily salary for half day attendance", integrated: "📅 Linked to Attendance", defaultPct: 50 },
                { type: "UNAPPROVED_LEAVE", label: "Unapproved Leave", icon: "🌿", color: "red", desc: "Deduct % of daily salary per rejected leave day", integrated: "🌿 Linked to Leaves", defaultPct: 100 },
                { type: "ABSENT", label: "Absent", icon: "❌", color: "red", desc: "Deduct % of daily salary per absent day", integrated: "📅 Linked to Attendance", defaultPct: 100 },
              ].map(ruleType => {
                const existing = deductionRules.find(r => r.type === ruleType.type);
                const isActive = existing?.isActive || false;
                const percentage = existing?.deductPercentage ?? ruleType.defaultPct;
                const colorMap: any = { orange: "border-orange-200 bg-orange-50", blue: "border-blue-200 bg-blue-50", red: "border-red-200 bg-red-50", green: "border-green-200 bg-green-50" };
                const activeColor = colorMap[ruleType.color] || "border-blue-200 bg-blue-50";
                return (
                  <div key={ruleType.type} className={\ounded-2xl p-5 border-2 transition-all \\}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={\w-10 h-10 rounded-xl flex items-center justify-center text-xl \\}>{ruleType.icon}</div>
                        <div>
                          <p className="font-black text-gray-900">{ruleType.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{ruleType.desc}</p>
                          <span className="text-xs text-blue-500 font-medium mt-1 block">{ruleType.integrated}</span>
                        </div>
                      </div>
                      <button onClick={() => {
                        const newRules = deductionRules.filter(r => r.type !== ruleType.type);
                        setDeductionRules([...newRules, { type: ruleType.type, deductPercentage: percentage, isActive: !isActive }]);
                      }} className={\elative inline-flex h-6 w-11 items-center rounded-full transition-colors \\}>
                        <span className={\inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform \\} />
                      </button>
                    </div>
                    {isActive && (
                      <div className="bg-white rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-gray-600">Deduction Percentage</label>
                          <div className="flex items-center gap-2">
                            <input type="number" value={percentage} min="1" max="100"
                              onChange={e => {
                                const newRules = deductionRules.filter(r => r.type !== ruleType.type);
                                setDeductionRules([...newRules, { type: ruleType.type, deductPercentage: Number(e.target.value), isActive }]);
                              }}
                              className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold" />
                            <span className="text-sm font-bold text-gray-500">%</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all" style={{width: percentage + "%", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)"}}></div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">= PKR {Math.round(30000 / 26 * percentage / 100).toLocaleString()} per occurrence (on PKR 30,000 salary)</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })};

content = content.replace(oldSection, newSection);

// Also update the how it works section
content = content.replace(
  '<p className="text-xs text-yellow-600">These rules automatically apply when creating payroll. The system checks attendance records for the selected month and calculates deductions accordingly.</p>',
  '<p className="text-xs text-yellow-600">These rules automatically apply when creating payroll. The system checks:</p><ul className="text-xs text-yellow-600 mt-1 space-y-0.5 list-disc list-inside"><li>📅 Attendance records → Late arrivals, Half days, Absences</li><li>🌿 Leave records → Rejected/unapproved leave days</li><li>💰 Per day salary = Basic ÷ 26 working days</li></ul>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');