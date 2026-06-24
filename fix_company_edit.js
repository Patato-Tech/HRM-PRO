const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/profile/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Replace header line to add edit button
lines[446] = '            <h2 className="font-black text-gray-900 text-lg">Company Information</h2>';
lines[447] = '            <div className="flex items-center gap-2">';
lines[448] = '              <span className={companyInfo?.status === "active" ? "text-xs px-3 py-1 rounded-full font-bold bg-green-100 text-green-700" : "text-xs px-3 py-1 rounded-full font-bold bg-yellow-100 text-yellow-700"}>{companyInfo?.status || "—"}</span>';
lines[449] = '              <button onClick={() => { setEditCompanyForm({name: companyInfo?.name || "", industry: companyInfo?.industry || "", address: companyInfo?.address || "", city: companyInfo?.city || "", country: companyInfo?.country || "", phone: companyInfo?.phone || "", website: companyInfo?.website || "", companySize: companyInfo?.companySize || "", regNumber: companyInfo?.regNumber || ""}); setShowEditCompany(true); }} className="text-xs font-bold text-white px-3 py-1.5 rounded-xl" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>✏️ Edit</button>';
lines[450] = '            </div>';

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Done!');