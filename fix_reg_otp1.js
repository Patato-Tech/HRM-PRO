const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/register/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add OTP states after existing states
content = content.replace(
  "  const [registeredEmail, setRegisteredEmail] = useState('');",
  "  const [registeredEmail, setRegisteredEmail] = useState('');\n  const [emailOtpSent, setEmailOtpSent] = useState(false);\n  const [emailOtp, setEmailOtp] = useState('');\n  const [emailVerified, setEmailVerified] = useState(false);\n  const [otpLoading, setOtpLoading] = useState(false);\n  const [otpError, setOtpError] = useState('');"
);

// Add email verification to validateStep2
content = content.replace(
  "    if (!form.adminEmail.trim() || !form.adminEmail.includes('@')) errors.push('Valid email is required.');",
  "    if (!form.adminEmail.trim() || !form.adminEmail.includes('@')) errors.push('Valid email is required.');\n    if (!emailVerified) errors.push('Please verify your email address first.');"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Step 1 done!');