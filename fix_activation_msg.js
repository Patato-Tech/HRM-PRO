const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "      setShowActivation(false);\n      setActivationOtp('');\n      setError('');\n      alert('Account activated successfully! Please login now.');",
  "      setShowActivation(false);\n      setActivationOtp('');\n      setError('✅ Account activated! Please login now.');"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');