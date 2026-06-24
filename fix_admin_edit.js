const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/admin/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add constants at top
content = content.replace(
  "'use client';",
  "'use client';\nconst INDUSTRIES = ['Technology','Finance','Healthcare','Education','Manufacturing','Retail','Construction','Transportation','Hospitality','Media','Real Estate','Agriculture','Other'];\nconst COUNTRIES = ['Pakistan','United Arab Emirates','Saudi Arabia','United Kingdom','United States','Canada','Australia','Other'];\nconst COMPANY_SIZES = ['1-10 employees','11-50 employees','51-200 employees','201-500 employees','500+ employees'];"
);

// Update editForm state with new fields
content = content.replace(
  "const [editForm, setEditForm] = useState({ name: '', industry: '', address: '', planId: '', status: '' });",
  "const [editForm, setEditForm] = useState({ name: '', industry: '', address: '', city: '', country: '', phone: '', website: '', companySize: '', regNumber: '', planId: '', status: '' });"
);

// Find where selectedCompany is set to editForm and add new fields
content = content.replace(
  "setEditForm({ name: selectedCompany.name, industry: selectedCompany.industry || '', address: selectedCompany.address || '', planId: selectedCompany.planId || '', status: selectedCompany.status })",
  "setEditForm({ name: selectedCompany.name, industry: selectedCompany.industry || '', address: selectedCompany.address || '', city: selectedCompany.city || '', country: selectedCompany.country || '', phone: selectedCompany.phone || '', website: selectedCompany.website || '', companySize: selectedCompany.companySize || '', regNumber: selectedCompany.regNumber || '', planId: selectedCompany.planId || '', status: selectedCompany.status })"
);

// Replace the modal with new fields
const oldModal = "{[{ label: 'Company Name *', key: 'name', type: 'text' }, { label: 'Industry', key: 'industry', type: 'text' }, { label: 'Address', key: 'address', type: 'text' }].map(field => (\n                <div key={field.key}><label className=\"block text-sm font-medium text-gray-700 mb-1\">{field.label}</label><input type={field.type} value={(editForm as any)[field.key]} onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })} className=\"w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900\" /></div>\n              ))}";

const newModal = [
  '<div className="grid grid-cols-2 gap-3">',
  '  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Company Name *</label><input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" /></div>',
  '  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Industry</label><select value={editForm.industry} onChange={e => setEditForm({...editForm, industry: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"><option value="">Select</option>{INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}</select></div>',
  '  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Company Size</label><select value={editForm.companySize} onChange={e => setEditForm({...editForm, companySize: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"><option value="">Select</option>{COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>',
  '  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label><input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="03XXXXXXXXX" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" /></div>',
  '  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Website</label><input type="text" value={editForm.website} onChange={e => setEditForm({...editForm, website: e.target.value})} placeholder="www.company.com" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" /></div>',
  '  <div><label className="block text-xs font-semibold text-gray-600 mb-1">City</label><input type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} placeholder="Enter city" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" /></div>',
  '  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Country</label><select value={editForm.country} onChange={e => setEditForm({...editForm, country: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"><option value="">Select</option>{COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>',
  '  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Reg. Number</label><input type="text" value={editForm.regNumber} onChange={e => setEditForm({...editForm, regNumber: e.target.value})} placeholder="Business reg. no." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" /></div>',
  '  <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Address</label><input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} placeholder="Enter address" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" /></div>',
  '</div>',
].join('\n              ');

content = content.replace(oldModal, newModal);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');