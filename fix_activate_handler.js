const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add handleActivateAccount before handleForgotPassword
content = content.replace(
  "  const handleForgotPassword = async () => {",
  "  const handleActivateAccount = async () => {\n    if (!activationOtp || activationOtp.length !== 6) { setActivationError('Enter the 6-digit OTP from your email'); return; }\n    setActivationLoading(true); setActivationError('');\n    try {\n      await apiCall('/auth/activate-account', { method: 'POST', body: JSON.stringify({ email: activationEmail, otp: activationOtp }) });\n      setShowActivation(false);\n      setActivationOtp('');\n      setError('');\n      alert('Account activated successfully! Please login now.');\n    } catch (e) { setActivationError('Invalid or expired OTP. Check your email.'); }\n    finally { setActivationLoading(false); }\n  };\n  const handleForgotPassword = async () => {"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');