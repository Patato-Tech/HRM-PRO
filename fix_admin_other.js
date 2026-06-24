const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/admin/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add customIndustry and customCountry states
content = content.replace(
  "const [editForm, setEditForm] = useState(",
  "const [customIndustryAdmin, setCustomIndustryAdmin] = useState(false);\n  const [customCountryAdmin, setCustomCountryAdmin] = useState(false);\n  const [editForm, setEditForm] = useState("
);

// Fix industry select onChange to handle Other
content = content.replace(
  'onChange={e => setEditForm({...editForm, industry: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"><option value="">Select</option>{INDUSTRIES.map((i: string) => <option key={i} value={i}>{i}</option>)}</select></div>',
  'onChange={e => { if (e.target.value === "Other") { setCustomIndustryAdmin(true); setEditForm({...editForm, industry: ""}); } else { setCustomIndustryAdmin(false); setEditForm({...editForm, industry: e.target.value}); }}} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"><option value="">Select</option>{INDUSTRIES.map((i: string) => <option key={i} value={i}>{i}</option>)}</select>{customIndustryAdmin && <input type="text" value={editForm.industry} onChange={e => setEditForm({...editForm, industry: e.target.value})} placeholder="Enter custom industry" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />}</div>'
);

// Fix country select onChange to handle Other
content = content.replace(
  'onChange={e => setEditForm({...editForm, country: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"><option value="">Select</option>{COUNTRIES.map((c: string) => <option key={c} value={c}>{c}</option>)}</select></div>',
  'onChange={e => { if (e.target.value === "Other") { setCustomCountryAdmin(true); setEditForm({...editForm, country: ""}); } else { setCustomCountryAdmin(false); setEditForm({...editForm, country: e.target.value}); }}} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"><option value="">Select</option>{COUNTRIES.map((c: string) => <option key={c} value={c}>{c}</option>)}</select>{customCountryAdmin && <input type="text" value={editForm.country} onChange={e => setEditForm({...editForm, country: e.target.value})} placeholder="Enter custom country" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />}</div>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');