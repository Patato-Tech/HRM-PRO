const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const saveHandler = [
  '  const handleSaveCompany = async () => {',
  '    setCompanyLoading(true); setCompanyError("");',
  '    try {',
  '      const token = localStorage.getItem("token") || "";',
  '      const updated = await apiCall("/auth/company", { method: "PUT", body: JSON.stringify(editCompanyForm) }, token);',
  '      setCompanyInfo(updated);',
  '      setShowEditCompany(false);',
  '    } catch (e) { setCompanyError(e?.message || "Failed to update."); }',
  '    finally { setCompanyLoading(false); }',
  '  };',
].join('\n');

content = content.replace('  const fetchCompanyInfo', saveHandler + '\n  const fetchCompanyInfo');

const modal = [
  '      {showEditCompany && (',
  '        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">',
  '          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">',
  '            <div className="flex items-center justify-between p-6 border-b border-gray-100">',
  '              <h3 className="text-lg font-black text-gray-900">Edit Company Info</h3>',
  '              <button onClick={() => setShowEditCompany(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">x</button>',
  '            </div>',
  '            <div className="p-6 space-y-4">',
  '              {companyError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{companyError}</div>}',
  '              <div className="grid grid-cols-2 gap-3">',
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
  '                    <input type="text" value={editCompanyForm[field.key] || ""} onChange={e => setEditCompanyForm({...editCompanyForm, [field.key]: e.target.value})}',
  '                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />',
  '                  </div>',
  '                ))}',
  '              </div>',
  '            </div>',
  '            <div className="flex gap-3 p-6 border-t border-gray-100">',
  '              <button onClick={() => setShowEditCompany(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100">Cancel</button>',
  '              <button onClick={handleSaveCompany} disabled={companyLoading} className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>',
  '                {companyLoading ? "Saving..." : "Save Changes"}',
  '              </button>',
  '            </div>',
  '          </div>',
  '        </div>',
  '      )}',
].join('\n');

content = content.replace('    </div>\n  );\n}', modal + '\n    </div>\n  );\n}');
fs.writeFileSync(file, content, 'utf8');
console.log('Done!');