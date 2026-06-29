const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/register/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add send OTP function before handleSubmit
content = content.replace(
  "  const handleSubmit = async () => {",
  "  const sendEmailOtp = async () => {\n    if (!form.adminEmail.includes('@')) { setOtpError('Enter a valid email first'); return; }\n    setOtpLoading(true); setOtpError('');\n    try {\n      await apiCall('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: form.adminEmail }) });\n      setEmailOtpSent(true);\n    } catch (e: any) { setOtpError(e?.message || 'Failed to send OTP'); }\n    finally { setOtpLoading(false); }\n  };\n  const verifyEmailOtp = async () => {\n    if (!emailOtp || emailOtp.length !== 6) { setOtpError('Enter the 6-digit OTP'); return; }\n    setOtpLoading(true); setOtpError('');\n    try {\n      await apiCall('/auth/verify-email-otp', { method: 'POST', body: JSON.stringify({ email: form.adminEmail, otp: emailOtp }) });\n      setEmailVerified(true);\n      setEmailOtpSent(false);\n      setOtpError('');\n    } catch (e: any) { setOtpError('Invalid or expired OTP'); }\n    finally { setOtpLoading(false); }\n  };\n  const handleSubmit = async () => {"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Step 2 done!');