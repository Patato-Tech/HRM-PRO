const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add validation to handleSaveCompany
content = content.replace(
  'const handleSaveCompany = async () => {\n    setCompanyLoading(true); setCompanyError("");\n    try {',
  'const handleSaveCompany = async () => {\n    setCompanyError("");\n    if (!editCompanyForm.name?.trim()) { setCompanyError("Company name is required."); return; }\n    if (editCompanyForm.phone && !/^03[0-9]{9}$/.test(editCompanyForm.phone.replace(/[-\s]/g, ""))) { setCompanyError("Phone format must be 03XXXXXXXXX."); return; }\n    if (editCompanyForm.website && !editCompanyForm.website.includes(".")) { setCompanyError("Enter a valid website URL."); return; }\n    setCompanyLoading(true);\n    try {'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');