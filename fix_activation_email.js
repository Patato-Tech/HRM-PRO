const fs = require('fs');

// Update email service to add fancy welcome with OTP
const emailFile = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/email/email.service.ts';
let email = fs.readFileSync(emailFile, 'utf8');

// Add new sendActivationEmail method
email = email.replace(
  "  async sendLeaveStatus(",
    async sendActivationEmail(toEmail, name, companyName, password, otp) {
    const content = \
      <h2 style="color:#1e293b;font-size:24px;font-weight:900;margin:0 0 8px;">Welcome to HRMPro Enterprise! 🎉</h2>
      <p style="color:#64748b;font-size:15px;margin:0 0 20px;">Hello <strong>\</strong>, your company <strong>\</strong> has been approved and your account is ready!</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin:0 0 20px;">
        <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 4px;">✅ Account Approved & Ready</p>
        <p style="color:#15803d;font-size:13px;margin:0;">Your HRMPro workspace is now active and ready to use.</p>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 20px;">
        <p style="color:#64748b;font-size:13px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Your Login Credentials</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;border-bottom:1px solid #f1f5f9;"><span style="color:#94a3b8;font-size:12px;">Company</span><br><span style="color:#1e293b;font-size:14px;font-weight:700;">\</span></td></tr>
          <tr><td style="padding:6px 0;border-bottom:1px solid #f1f5f9;"><span style="color:#94a3b8;font-size:12px;">Email</span><br><span style="color:#1e293b;font-size:14px;font-weight:700;">\</span></td></tr>
          <tr><td style="padding:6px 0;"><span style="color:#94a3b8;font-size:12px;">Password</span><br><span style="color:#1e293b;font-size:14px;font-weight:700;">\</span></td></tr>
        </table>
      </div>
      <p style="color:#1e293b;font-size:15px;font-weight:700;margin:0 0 8px;">Enter this OTP to activate your account:</p>
      <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-radius:12px;padding:24px;text-align:center;margin:0 0 20px;">
        <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Activation OTP</p>
        <h1 style="color:#ffffff;font-size:48px;font-weight:900;margin:0;letter-spacing:12px;">\</h1>
        <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:8px 0 0;">Valid for 24 hours</p>
      </div>
      <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin:0 0 20px;">
        <p style="color:#92400e;font-size:13px;margin:0;">⚠️ You must enter this OTP when logging in for the first time to activate your account.</p>
      </div>
      <a href="http://localhost:3001" style="display:block;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;text-align:center;font-weight:700;font-size:15px;">Login to HRMPro →</a>\;
    await this.transporter.sendMail({
      from: '"HRMPro Enterprise" <hrmtesting461@gmail.com>',
      to: toEmail,
      subject: 'Welcome to HRMPro - Activate Your Account',
      html: this.baseTemplate('Welcome to HRMPro Enterprise', content),
    });
  }

  async sendLeaveStatus(
);

fs.writeFileSync(emailFile, email, 'utf8');
console.log('Email service updated!');