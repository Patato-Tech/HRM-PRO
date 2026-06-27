const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/payroll/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Find the rules section
let startIdx = -1, endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('LATE_ARRIVAL') && lines[i].includes('Late Arrival') && lines[i].includes('icon')) { startIdx = i - 1; break; }
}
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].includes('How deductions work')) { endIdx = i + 3; break; }
}
console.log('Start:', startIdx + 1, 'End:', endIdx + 1);

const newRules = [
  '              {[',
  '                { type: "LATE_ARRIVAL", label: "Late Arrival", icon: "⏰", color: "orange", desc: "Deduct % of daily salary per late check-in", link: "📅 Attendance", defaultPct: 50 },',
  '                { type: "HALF_DAY", label: "Half Day", icon: "🌓", color: "blue", desc: "Deduct % of daily salary for half day", link: "📅 Attendance", defaultPct: 50 },',
  '                { type: "UNAPPROVED_LEAVE", label: "Unapproved Leave", icon: "🌿", color: "red", desc: "Deduct % of daily salary per rejected leave", link: "🌿 Leaves", defaultPct: 100 },',
  '                { type: "ABSENT", label: "Absent", icon: "❌", color: "red", desc: "Deduct % of daily salary per absent day", link: "📅 Attendance", defaultPct: 100 },',
  '              ].map(ruleType => {',
  '                const existing = deductionRules.find(r => r.type === ruleType.type);',
  '                const isActive = existing?.isActive || false;',
  '                const percentage = existing?.deductPercentage ?? ruleType.defaultPct;',
  '                const colorMap = { orange: "border-orange-200 bg-orange-50", blue: "border-blue-200 bg-blue-50", red: "border-red-200 bg-red-50" } as any;',
  '                return (',
  '                  <div key={ruleType.type} className={ounded-2xl p-4 border-2 transition-all }>',
  '                    <div className="flex items-start justify-between">',
  '                      <div className="flex items-center gap-3">',
  '                        <div className={w-10 h-10 rounded-xl flex items-center justify-center text-xl }>{ruleType.icon}</div>',
  '                        <div>',
  '                          <p className="font-black text-gray-900 text-sm">{ruleType.label}</p>',
  '                          <p className="text-xs text-gray-400">{ruleType.desc}</p>',
  '                          <span className="text-xs text-blue-500 font-medium">{ruleType.link}</span>',
  '                        </div>',
  '                      </div>',
  '                      <button onClick={() => {',
  '                        const newRules = deductionRules.filter(r => r.type !== ruleType.type);',
  '                        setDeductionRules([...newRules, { type: ruleType.type, deductPercentage: percentage, isActive: !isActive }]);',
  '                      }} className={elative inline-flex h-6 w-11 items-center rounded-full transition-colors }>',
  '                        <span className={inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform } />',
  '                      </button>',
  '                    </div>',
  '                    {isActive && (',
  '                      <div className="mt-3 bg-white rounded-xl p-3 border border-gray-100">',
  '                        <div className="flex items-center justify-between mb-2">',
  '                          <label className="text-xs font-semibold text-gray-600">Deduction %</label>',
  '                          <div className="flex items-center gap-2">',
  '                            <input type="number" value={percentage} min="1" max="100"',
  '                              onChange={e => {',
  '                                const nr = deductionRules.filter(r => r.type !== ruleType.type);',
  '                                setDeductionRules([...nr, { type: ruleType.type, deductPercentage: Number(e.target.value), isActive }]);',
  '                              }}',
  '                              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold" />',
  '                            <span className="text-sm font-bold text-gray-500">%</span>',
  '                          </div>',
  '                        </div>',
  '                        <div className="w-full bg-gray-100 rounded-full h-1.5">',
  '                          <div className="h-1.5 rounded-full transition-all" style={{width: percentage + "%", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)"}}></div>',
  '                        </div>',
  '                      </div>',
  '                    )}',
  '                  </div>',
  '                );',
  '              })}',
  '              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">',
  '                <p className="text-xs text-yellow-700 font-semibold mb-1">ℹ️ How deductions work:</p>',
  '                <p className="text-xs text-yellow-600">Checks attendance (late/absent/half-day) and leave records (rejected leaves) for the month. Per day = Basic ÷ 26.</p>',
  '              </div>',
];

lines.splice(startIdx, endIdx - startIdx, ...newRules);
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Done! Lines:', lines.length);