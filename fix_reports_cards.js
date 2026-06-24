const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx";
let c = fs.readFileSync(file, "utf8");

// Fix all instances of old stat card pattern
const oldCard = `].map((s, i) => (
                  <div key={i} className={\`\${s.bg} rounded-2xl p-5\`}>
                    <p className="text-xs text-gray-500 font-medium mb-2">{s.label}</p>
                    <p className={\`text-3xl font-bold \${s.color}\`}>{s.value}</p>
                  </div>
                ))}`;

const newCard = `].map((s, i) => (
                  <div key={i} className="rounded-2xl p-4 relative overflow-hidden"
                    style={{background:["linear-gradient(135deg,#1d4ed8,#3b82f6)","linear-gradient(135deg,#d97706,#f59e0b)","linear-gradient(135deg,#059669,#10b981)","linear-gradient(135deg,#dc2626,#ef4444)"][i%4],boxShadow:["0 4px 15px rgba(59,130,246,0.3)","0 4px 15px rgba(245,158,11,0.3)","0 4px 15px rgba(16,185,129,0.3)","0 4px 15px rgba(239,68,68,0.3)"][i%4]}}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"rgba(255,255,255,0.75)"}}>{s.label}</p>
                    <p className="text-3xl font-black text-white">{s.format ? "PKR "+(s.value/1000).toFixed(0)+"K" : s.value}</p>
                  </div>
                ))}`;

c = c.replaceAll(oldCard, newCard);

// Also fix simpler pattern without format
const oldCard2 = `].map((s, i) => (
                  <div key={i} className={\`\${s.bg} rounded-2xl p-5\`}>`;
const newCard2 = `].map((s, i) => (
                  <div key={i} className="rounded-2xl p-4 relative overflow-hidden"
                    style={{background:["linear-gradient(135deg,#1d4ed8,#3b82f6)","linear-gradient(135deg,#059669,#10b981)","linear-gradient(135deg,#dc2626,#ef4444)","linear-gradient(135deg,#7c3aed,#8b5cf6)"][i%4],boxShadow:"0 4px 15px rgba(0,0,0,0.15)"}}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />`;
c = c.replaceAll(oldCard2, newCard2);

// Fix the text color for these cards
c = c.replaceAll(
  `<p className="text-xs text-gray-500 font-medium mb-2">{s.label}</p>
                    <p className={\`text-3xl font-bold \${s.color}\`}>{s.value}</p>`,
  `<p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"rgba(255,255,255,0.75)"}}>{s.label}</p>
                    <p className="text-3xl font-black text-white">{s.value}</p>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
