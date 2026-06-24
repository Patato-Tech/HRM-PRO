const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add constants at top of file after imports
content = content.replace(
  "type TabKey =",
  "const INDUSTRIES = ['Technology','Finance','Healthcare','Education','Manufacturing','Retail','Construction','Transportation','Hospitality','Media','Real Estate','Agriculture','Other'];\nconst COUNTRIES = ['Pakistan','United Arab Emirates','Saudi Arabia','United Kingdom','United States','Canada','Australia','Other'];\nconst COMPANY_SIZES = ['1-10 employees','11-50 employees','51-200 employees','201-500 employees','500+ employees'];\n\ntype TabKey ="
);

// Replace the modal fields array with smart fields
const oldFields = [
  '                {[',
  '                  { label: "Company Name", key: "name" },',
  '                  { label: "Industry", key: "industry" },',
  '                  { label: "Phone", key: "phone" },',
  '                  { label: "Website", key: "website" },',
  '                  { label: "City", key: "city" },',
  '                  { label: "Country", key: "country" },',
  '                  { label: "Company Size", key: "companySize" },',
  '                  { label: "Reg. Number", key: "regNumber" },',
  '                  { label: "Address", key: "address" },',
  '                ].map((field) => (',
  '                  <div key={field.key} className={field.key === "address" ? "col-span-2" : ""}>',
  '                    <label className="block text-xs font-semibold text-gray-600 mb-1">{field.label}</label>',
  '                    <input type="text" value={editCompanyForm[field.key] || ""} onChange={e => setEditCompanyForm({...editCompanyForm, [field.key]: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />',
  '                  </div>',
  '                ))}',
].join('\n');

const newFields = [
  '                <div>',
  '                  <label className="block text-xs font-semibold text-gray-600 mb-1">Company Name *</label>',
  '                  <input type="text" value={editCompanyForm.name || ""} onChange={e => setEditCompanyForm({...editCompanyForm, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />',
  '                </div>',
  '                <div>',
  '                  <label className="block text-xs font-semibold text-gray-600 mb-1">Industry</label>',
  '                  <select value={INDUSTRIES.includes(editCompanyForm.industry || "") ? editCompanyForm.industry || "" : "Other"} onChange={e => setEditCompanyForm({...editCompanyForm, industry: e.target.value === "Other" ? "" : e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50">',
  '                    <option value="">Select industry</option>',
  '                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}',
  '                  </select>',
  '                  {!INDUSTRIES.slice(0,-1).includes(editCompanyForm.industry || "") && editCompanyForm.industry !== "" && (',
  '                    <input type="text" value={editCompanyForm.industry || ""} onChange={e => setEditCompanyForm({...editCompanyForm, industry: e.target.value})} placeholder="Enter custom industry" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />',
  '                  )}',
  '                </div>',
  '                <div>',
  '                  <label className="block text-xs font-semibold text-gray-600 mb-1">Company Size</label>',
  '                  <select value={editCompanyForm.companySize || ""} onChange={e => setEditCompanyForm({...editCompanyForm, companySize: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50">',
  '                    <option value="">Select size</option>',
  '                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}',
  '                  </select>',
  '                </div>',
  '                <div>',
  '                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>',
  '                  <input type="tel" value={editCompanyForm.phone || ""} onChange={e => setEditCompanyForm({...editCompanyForm, phone: e.target.value})} placeholder="03XXXXXXXXX" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />',
  '                </div>',
  '                <div>',
  '                  <label className="block text-xs font-semibold text-gray-600 mb-1">Website</label>',
  '                  <input type="text" value={editCompanyForm.website || ""} onChange={e => setEditCompanyForm({...editCompanyForm, website: e.target.value})} placeholder="www.company.com" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />',
  '                </div>',
  '                <div>',
  '                  <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>',
  '                  <input type="text" value={editCompanyForm.city || ""} onChange={e => setEditCompanyForm({...editCompanyForm, city: e.target.value})} placeholder="Enter city" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />',
  '                </div>',
  '                <div>',
  '                  <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>',
  '                  <select value={COUNTRIES.includes(editCompanyForm.country || "") ? editCompanyForm.country || "" : "Other"} onChange={e => setEditCompanyForm({...editCompanyForm, country: e.target.value === "Other" ? "" : e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50">',
  '                    <option value="">Select country</option>',
  '                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}',
  '                  </select>',
  '                  {!COUNTRIES.slice(0,-1).includes(editCompanyForm.country || "") && editCompanyForm.country !== "" && (',
  '                    <input type="text" value={editCompanyForm.country || ""} onChange={e => setEditCompanyForm({...editCompanyForm, country: e.target.value})} placeholder="Enter custom country" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />',
  '                  )}',
  '                </div>',
  '                <div>',
  '                  <label className="block text-xs font-semibold text-gray-600 mb-1">Reg. Number</label>',
  '                  <input type="text" value={editCompanyForm.regNumber || ""} onChange={e => setEditCompanyForm({...editCompanyForm, regNumber: e.target.value})} placeholder="Business reg. number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />',
  '                </div>',
  '                <div className="col-span-2">',
  '                  <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>',
  '                  <input type="text" value={editCompanyForm.address || ""} onChange={e => setEditCompanyForm({...editCompanyForm, address: e.target.value})} placeholder="Enter address" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />',
  '                </div>',
].join('\n');

content = content.replace(oldFields, newFields);
fs.writeFileSync(file, content, 'utf8');
console.log('Done!');