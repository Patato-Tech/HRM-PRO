const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add activation states
content = content.replace(
  "  const [otpSent, setOtpSent] = useState(false);",
  "  const [otpSent, setOtpSent] = useState(false);\n  const [showActivation, setShowActivation] = useState(false);\n  const [activationEmail, setActivationEmail] = useState('');\n  const [activationOtp, setActivationOtp] = useState('');\n  const [activationLoading, setActivationLoading] = useState(false);\n  const [activationError, setActivationError] = useState('');"
);

// Handle activation error in login
content = content.replace(
  "      const msg = err.message || 'Invalid credentials';\n      const p = getErrorPopup(msg);\n      if (p) setPopup(p); else setError(msg);",
  "      const msg = err.message || 'Invalid credentials';\n      try {\n        const parsed = JSON.parse(msg);\n        if (parsed.code === 'ACCOUNT_NOT_ACTIVATED') {\n          setActivationEmail(parsed.email);\n          setShowActivation(true);\n          return;\n        }\n      } catch {}\n      const p = getErrorPopup(msg);\n      if (p) setPopup(p); else setError(msg);"
);

// Add activation handler
content = content.replace(
  "  const sendEmailOtp = async () => {",
  "  const handleActivateAccount = async () => {\n    if (!activationOtp || activationOtp.length !== 6) { setActivationError('Enter the 6-digit OTP from your email'); return; }\n    setActivationLoading(true); setActivationError('');\n    try {\n      await apiCall('/auth/activate-account', { method: 'POST', body: JSON.stringify({ email: activationEmail, otp: activationOtp }) });\n      setShowActivation(false);\n      setActivationOtp('');\n      setError('');\n      setForm({ ...form, email: activationEmail });\n      alert('Account activated! Please login now.');\n    } catch (e: any) { setActivationError('Invalid or expired OTP. Check your email.'); }\n    finally { setActivationLoading(false); }\n  };\n  const sendEmailOtp = async () => {"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');