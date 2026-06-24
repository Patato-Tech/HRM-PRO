const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/profile/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix industry Other logic - use a flag instead
content = content.replace(
  'const [showEditCompany, setShowEditCompany] = useState(false);',
  'const [showEditCompany, setShowEditCompany] = useState(false);\n  const [customIndustry, setCustomIndustry] = useState(false);\n  const [customCountry, setCustomCountry] = useState(false);'
);

// Fix industry select onChange
content = content.replace(
  'onChange={e => setEditCompanyForm({...editCompanyForm, industry: e.target.value === "Other" ? "" : e.target.value})}',
  'onChange={e => { if (e.target.value === "Other") { setCustomIndustry(true); setEditCompanyForm({...editCompanyForm, industry: ""}); } else { setCustomIndustry(false); setEditCompanyForm({...editCompanyForm, industry: e.target.value}); }}}'
);

// Fix industry custom input condition
content = content.replace(
  '{!INDUSTRIES.slice(0,-1).includes(editCompanyForm.industry || "") && editCompanyForm.industry !== "" && (',
  '{customIndustry && ('
);

// Fix country select onChange
content = content.replace(
  'onChange={e => setEditCompanyForm({...editCompanyForm, country: e.target.value === "Other" ? "" : e.target.value})}',
  'onChange={e => { if (e.target.value === "Other") { setCustomCountry(true); setEditCompanyForm({...editCompanyForm, country: ""}); } else { setCustomCountry(false); setEditCompanyForm({...editCompanyForm, country: e.target.value}); }}}'
);

// Fix country custom input condition  
content = content.replace(
  '{!COUNTRIES.slice(0,-1).includes(editCompanyForm.country || "") && editCompanyForm.country !== "" && (',
  '{customCountry && ('
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');