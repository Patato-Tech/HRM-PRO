const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/register/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "await apiCall('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: form.adminEmail }) });",
  "await apiCall('/auth/send-verification-otp', { method: 'POST', body: JSON.stringify({ email: form.adminEmail }) });"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');