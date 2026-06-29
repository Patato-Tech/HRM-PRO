const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add OTP state
content = content.replace(
  "  const [resetToken, setResetToken] = useState('');",
  "  const [resetToken, setResetToken] = useState('');\n  const [otpSent, setOtpSent] = useState(false);\n  const [otp, setOtp] = useState('');"
);

// Update handleForgotPassword to send OTP
content = content.replace(
  "      const data = await apiCall('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: forgotEmail }) });\n      setResetToken(data.resetToken || '');\n",
  "      await apiCall('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: forgotEmail }) });\n      setOtpSent(true);\n      setForgotSuccess('OTP sent to your email! Check your inbox.');\n"
);

// Update reset password to use OTP
content = content.replace(
  "      await apiCall('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: resetToken, newPassword }) });",
  "      await apiCall('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email: forgotEmail, otp, newPassword }) });"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');