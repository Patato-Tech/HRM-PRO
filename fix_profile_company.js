const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add company to TabKey
content = content.replace(
  "type TabKey = 'info' | 'security' | 'payroll' | 'documents' | 'salary';",
  "type TabKey = 'info' | 'security' | 'payroll' | 'documents' | 'salary' | 'company';"
);

// 2. Add state variables after existing states
content = content.replace(
  "const [activeTab, setActiveTab] = useState<TabKey>('info');",
  "const [activeTab, setActiveTab] = useState<TabKey>('info');\n  const [companyInfo, setCompanyInfo] = useState<any>(null);\n  const [showEditCompany, setShowEditCompany] = useState(false);\n  const [editCompanyForm, setEditCompanyForm] = useState<any>({});\n  const [companyLoading, setCompanyLoading] = useState(false);\n  const [companyError, setCompanyError] = useState('');"
);

// 3. Add fetchCompanyInfo call in useEffect
content = content.replace(
  'fetchEmployeeInfo();',
  'fetchEmployeeInfo();\n      fetchCompanyInfo();'
);

// 4. Add fetchCompanyInfo and handleSaveCompany functions
content = content.replace(
  'const fetchEmployeeInfo = async () => {',
  'const fetchCompanyInfo = async () => {\n    if (!user) return;\n    try {\n      const token = localStorage.getItem("token") || "";\n      const data = await apiCall("/auth/company", {}, token);\n      setCompanyInfo(data);\n    } catch (e) { console.error(e); }\n  };\n  const handleSaveCompany = async () => {\n    setCompanyLoading(true); setCompanyError("");\n    try {\n      const token = localStorage.getItem("token") || "";\n      const updated = await apiCall("/auth/company", { method: "PUT", body: JSON.stringify(editCompanyForm) }, token);\n      setCompanyInfo(updated);\n      setShowEditCompany(false);\n    } catch (e) { setCompanyError(e?.message || "Failed to update."); }\n    finally { setCompanyLoading(false); }\n  };\n  const fetchEmployeeInfo = async () => {'
);

// 5. Add company tab button
content = content.replace(
  "{ key: 'security', label: '🔒 Security' },",
  "{ key: 'security', label: '🔒 Security' },\n    ...(isAdmin ? [{ key: 'company' as TabKey, label: '🏢 Company Info' }] : []),"
);

// 6. Add company tab content before security tab
const companyTabContent = [
  "      {/* COMPANY INFO TAB */}",
  "      {activeTab === 'company' && isAdmin && (",
  '        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">',
  '          <div className="flex items-center justify-between">',
  '            <h2 className="font-black text-gray-900 text-lg">Company Information</h2>',
  '            <div className="flex items-center gap-2">',
  '              <span className={companyInfo?.status === "active" ? "text-xs px-3 py-1 rounded-full font-bold bg-green-100 text-green-700" : "text-xs px-3 py-1 rounded-full font-bold bg-yellow-100 text-yellow-700"}>{companyInfo?.status || "—"}</span>',
  '              <button onClick={() => { setEditCompanyForm({name: companyInfo?.name||"", industry: companyInfo?.industry||"", address: companyInfo?.address||"", city: companyInfo?.city||"", country: companyInfo?.country||"", phone: companyInfo?.phone||"", website: companyInfo?.website||"", companySize: companyInfo?.companySize||"", regNumber: companyInfo?.regNumber||""}); setShowEditCompany(true); }} className="text-xs font-bold text-white px-3 py-1.5 rounded-xl" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>Edit</button>',
  '            </div>',
  '          </div>',
  '          {companyInfo ? (',
  '            <div className="grid grid-cols-2 gap-4">',
  '              {[',
  '                { label: "Company Name", value: companyInfo.name },',
  '                { label: "Industry", value: companyInfo.industry },',
  '                { label: "Company Size", value: companyInfo.companySize },',
  '                { label: "Phone", value: companyInfo.phone },',
  '                { label: "Website", value: companyInfo.website },',
  '                { label: "City", value: companyInfo.city },',
  '                { label: "Country", value: companyInfo.country },',
  '                { label: "Address", value: companyInfo.address },',
  '                { label: "Reg. Number", value: companyInfo.regNumber },',
  '                { label: "Member Since", value: companyInfo.createdAt ? new Date(companyInfo.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null },',
  '              ].map((item, i) => (',
  '                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">',
  '                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>',
  '                  <p className="text-sm font-semibold text-gray-900">{item.value || "—"}</p>',
  '                </div>',
  '              ))}',
  '            </div>',
  '          ) : (',
  '            <div className="text-center py-8 text-gray-400">Loading company info...</div>',
  '          )}',
  '        </div>',
  '      )}',
].join('\n');

content = content.replace("      {/* SECURITY TAB */}", companyTabContent + '\n      {/* SECURITY TAB */}');

// 7. Add edit modal before last closing tags
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
  '                    <input type="text" value={editCompanyForm[field.key] || ""} onChange={e => setEditCompanyForm({...editCompanyForm, [field.key]: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />',
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