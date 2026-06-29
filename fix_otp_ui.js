const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update forgot password description
content = content.replace(
  'Enter your email and we will generate a password reset token.',
  'Enter your email to receive a 6-digit OTP for password reset.'
);

// Update button text
content = content.replace(
  '{forgotLoading ? "Processing..." : "Get Reset Token"}',
  '{forgotLoading ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}'
);

// Add OTP input after email input
content = content.replace(
  '            <div className="flex gap-3">',
  '            {otpSent && (\n              <div className="mb-5">\n                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label>\n                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50 text-center text-2xl font-bold tracking-widest" />\n                <p className="text-xs text-gray-400 mt-1 text-center">Check your email inbox</p>\n              </div>\n            )}\n            <div className="flex gap-3">'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');