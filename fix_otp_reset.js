const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add new password fields to forgot modal after OTP input
content = content.replace(
  "                <p className=\"text-xs text-gray-400 mt-1 text-center\">Check your email inbox</p>\n              </div>\n            )}\n            <div className=\"flex gap-3\">",
  "                <p className=\"text-xs text-gray-400 mt-1 text-center\">Check your email inbox</p>\n              </div>\n            )}\n            {otpSent && (\n              <div className=\"mb-5 space-y-3\">\n                <div>\n                  <label className=\"block text-sm font-semibold text-gray-700 mb-2\">New Password</label>\n                  <input type=\"password\" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder=\"Enter new password\" className=\"w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50\" />\n                </div>\n                <div>\n                  <label className=\"block text-sm font-semibold text-gray-700 mb-2\">Confirm Password</label>\n                  <input type=\"password\" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder=\"Confirm new password\" className=\"w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50\" />\n                </div>\n                <button onClick={handleResetPassword} disabled={forgotLoading || !otp || !newPassword || newPassword !== confirmNewPassword} className=\"w-full text-white py-3 rounded-2xl text-sm font-bold disabled:opacity-50\" style={{background:\"linear-gradient(135deg,#059669,#10b981)\"}}>{forgotLoading ? \"Resetting...\" : \"Reset Password\"}</button>\n              </div>\n            )}\n            <div className=\"flex gap-3\">"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');