const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/documents/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add customDocType state
content = content.replace(
  "const [showAddModal, setShowAddModal] = useState(false);",
  "const [showAddModal, setShowAddModal] = useState(false);\n  const [customDocType, setCustomDocType] = useState(false);"
);

// Fix the type select to handle Other
content = content.replace(
  '<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}\n                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">\n                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}\n                  </select>',
  '<select value={customDocType ? "Other" : form.type} onChange={e => { if (e.target.value === "Other") { setCustomDocType(true); setForm({...form, type: ""}); } else { setCustomDocType(false); setForm({...form, type: e.target.value}); }}} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">\n                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}\n                  </select>\n                  {customDocType && <input type="text" value={form.type} onChange={e => setForm({...form, type: e.target.value})} placeholder="Enter custom document type" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />}'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');