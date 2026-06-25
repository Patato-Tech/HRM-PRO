const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add forgot password states
content = content.replace(
  "const [animIn, setAnimIn] = useState(false);",
  "const [animIn, setAnimIn] = useState(false);\n  const [showForgotPw, setShowForgotPw] = useState(false);\n  const [showResetPw, setShowResetPw] = useState(false);\n  const [forgotEmail, setForgotEmail] = useState('');\n  const [resetToken, setResetToken] = useState('');\n  const [newPassword, setNewPassword] = useState('');\n  const [confirmNewPassword, setConfirmNewPassword] = useState('');\n  const [forgotLoading, setForgotLoading] = useState(false);\n  const [forgotError, setForgotError] = useState('');\n  const [forgotSuccess, setForgotSuccess] = useState('');"
);

// Add forgot password handlers before handleKeyDown
const handlers = [
  "  const handleForgotPassword = async () => {",
  "    if (!forgotEmail.trim() || !forgotEmail.includes('@')) { setForgotError('Please enter a valid email.'); return; }",
  "    setForgotLoading(true); setForgotError('');",
  "    try {",
  "      const data = await apiCall('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: forgotEmail }) });",
  "      setResetToken(data.resetToken || '');",
  "      setShowForgotPw(false);",
  "      setShowResetPw(true);",
  "    } catch (e) { setForgotError('Failed. Please check your email.'); }",
  "    finally { setForgotLoading(false); }",
  "  };",
  "  const handleResetPassword = async () => {",
  "    if (!newPassword || newPassword.length < 8) { setForgotError('Password must be at least 8 characters.'); return; }",
  "    if (newPassword !== confirmNewPassword) { setForgotError('Passwords do not match.'); return; }",
  "    setForgotLoading(true); setForgotError('');",
  "    try {",
  "      await apiCall('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: resetToken, newPassword }) });",
  "      setShowResetPw(false);",
  "      setForgotSuccess('Password reset! You can now login.');",
  "    } catch (e) { setForgotError('Failed to reset password. Token may be expired.'); }",
  "    finally { setForgotLoading(false); }",
  "  };",
].join('\n');
content = content.replace("  const handleKeyDown", handlers + "\n  const handleKeyDown");

// Add forgot password link - simple replacement
content = content.replace(
  '<button onClick={handleLogin} disabled={loading}',
  '<div className="text-right -mt-2"><button type="button" onClick={() => { setShowForgotPw(true); setForgotError(""); setForgotEmail(""); }} className="text-xs text-blue-500 hover:text-blue-700 font-medium hover:underline">Forgot password?</button></div>\n            <button onClick={handleLogin} disabled={loading}'
);

// Add success message
content = content.replace(
  '{error && (',
  '{forgotSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 mb-5 text-sm">{forgotSuccess}</div>}\n          {error && ('
);

// Add modals before last </div>
const modals = [
  '{showForgotPw && (',
  '  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">',
  '    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">',
  '      <div className="flex items-center justify-between mb-6">',
  '        <h3 className="text-xl font-black text-gray-900">Forgot Password</h3>',
  '        <button onClick={() => setShowForgotPw(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">x</button>',
  '      </div>',
  '      <p className="text-sm text-gray-500 mb-5">Enter your email and we will generate a password reset token.</p>',
  '      {forgotError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{forgotError}</div>}',
  '      <div className="mb-5">',
  '        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>',
  '        <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Enter your email" className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50" />',
  '      </div>',
  '      <div className="flex gap-3">',
  '        <button onClick={() => setShowForgotPw(false)} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-medium">Cancel</button>',
  '        <button onClick={handleForgotPassword} disabled={forgotLoading} className="flex-1 text-white py-3 rounded-2xl text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>',
  '          {forgotLoading ? "Processing..." : "Get Reset Token"}',
  '        </button>',
  '      </div>',
  '    </div>',
  '  </div>',
  ')}',
  '{showResetPw && (',
  '  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">',
  '    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">',
  '      <div className="flex items-center justify-between mb-6">',
  '        <h3 className="text-xl font-black text-gray-900">Reset Password</h3>',
  '        <button onClick={() => setShowResetPw(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">x</button>',
  '      </div>',
  '      {forgotError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{forgotError}</div>}',
  '      <div className="space-y-4 mb-5">',
  '        <div>',
  '          <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>',
  '          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password (8+ chars)" className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50" />',
  '        </div>',
  '        <div>',
  '          <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>',
  '          <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 bg-gray-50" />',
  '          {newPassword && confirmNewPassword && <p className={"text-xs mt-1 font-medium " + (newPassword === confirmNewPassword ? "text-green-600" : "text-red-500")}>{newPassword === confirmNewPassword ? "✓ Passwords match" : "✗ Passwords do not match"}</p>}',
  '        </div>',
  '      </div>',
  '      <div className="flex gap-3">',
  '        <button onClick={() => setShowResetPw(false)} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-medium">Cancel</button>',
  '        <button onClick={handleResetPassword} disabled={forgotLoading} className="flex-1 text-white py-3 rounded-2xl text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#059669,#10b981)"}}>',
  '          {forgotLoading ? "Resetting..." : "Reset Password"}',
  '        </button>',
  '      </div>',
  '    </div>',
  '  </div>',
  ')}',
].join('\n      ');

content = content.replace('    </div>\n  );\n}', '      ' + modals + '\n    </div>\n  );\n}');
fs.writeFileSync(file, content, 'utf8');
console.log('Done!');