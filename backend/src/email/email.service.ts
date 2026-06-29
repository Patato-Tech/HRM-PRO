import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'hrmtesting461@gmail.com',
      pass: 'jlzimjgbdaniaene',
    },
  });

  private baseTemplate(title: string, content: string, color = '#1d4ed8') {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,${color},#3b82f6);padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:900;letter-spacing:-0.5px;">HRMPro Enterprise</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Human Resource Management Platform</p>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:40px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© 2026 HRMPro Enterprise. All rights reserved.</p>
          <p style="color:#94a3b8;font-size:12px;margin:4px 0 0;">This is an automated email. Please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  async sendOTP(email: string, name: string, otp: string, purpose: string) {
    const content = `
      <h2 style="color:#1e293b;font-size:22px;font-weight:800;margin:0 0 8px;">Hello, ${name}! 👋</h2>
      <p style="color:#64748b;font-size:15px;margin:0 0 24px;">Your OTP for <strong>${purpose}</strong> is:</p>
      <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
        <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">One-Time Password</p>
        <h1 style="color:#ffffff;font-size:48px;font-weight:900;margin:0;letter-spacing:12px;">${otp}</h1>
        <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:8px 0 0;">Valid for 5 minutes only</p>
      </div>
      <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin:0 0 24px;">
        <p style="color:#92400e;font-size:13px;margin:0;">⚠️ Never share this OTP with anyone. HRMPro will never ask for your OTP.</p>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0;">If you didn't request this OTP, please ignore this email or contact support.</p>`;
    
    await this.transporter.sendMail({
      from: '"HRMPro Enterprise" <hrmtesting461@gmail.com>',
      to: email,
      subject: `${otp} is your HRMPro OTP`,
      html: this.baseTemplate(`OTP Verification`, content),
    });
  }

  async sendWelcome(email: string, name: string, companyName: string, role: string, password: string) {
    const content = `
      <h2 style="color:#1e293b;font-size:22px;font-weight:800;margin:0 0 8px;">Welcome to HRMPro! 🎉</h2>
      <p style="color:#64748b;font-size:15px;margin:0 0 24px;">Your account has been created successfully. Here are your login credentials:</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:0 0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
            <span style="color:#94a3b8;font-size:13px;">Company</span><br>
            <span style="color:#1e293b;font-size:15px;font-weight:700;">${companyName}</span>
          </td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
            <span style="color:#94a3b8;font-size:13px;">Role</span><br>
            <span style="color:#1e293b;font-size:15px;font-weight:700;">${role}</span>
          </td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
            <span style="color:#94a3b8;font-size:13px;">Email</span><br>
            <span style="color:#1e293b;font-size:15px;font-weight:700;">${email}</span>
          </td></tr>
          <tr><td style="padding:8px 0;">
            <span style="color:#94a3b8;font-size:13px;">Password</span><br>
            <span style="color:#1e293b;font-size:15px;font-weight:700;">${password}</span>
          </td></tr>
        </table>
      </div>
      <a href="http://localhost:3001" style="display:block;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;text-align:center;font-weight:700;font-size:15px;margin:0 0 24px;">Login to HRMPro →</a>
      <p style="color:#ef4444;font-size:13px;margin:0;">🔒 Please change your password after first login for security.</p>`;

    await this.transporter.sendMail({
      from: '"HRMPro Enterprise" <hrmtesting461@gmail.com>',
      to: email,
      subject: `Welcome to HRMPro - Your Account is Ready`,
      html: this.baseTemplate(`Welcome to HRMPro`, content),
    });
  }

  async sendPasswordReset(email: string, name: string, otp: string) {
    await this.sendOTP(email, name, otp, 'Password Reset');
  }

  async sendCompanyApproved(email: string, name: string, companyName: string) {
    const content = `
      <h2 style="color:#1e293b;font-size:22px;font-weight:800;margin:0 0 8px;">Great News! 🎉</h2>
      <p style="color:#64748b;font-size:15px;margin:0 0 24px;">Your company <strong>${companyName}</strong> has been approved on HRMPro Enterprise.</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center;">
        <p style="color:#166534;font-size:16px;font-weight:700;margin:0;">✅ Account Activated</p>
        <p style="color:#15803d;font-size:13px;margin:8px 0 0;">You can now login and start managing your HR operations.</p>
      </div>
      <a href="http://localhost:3001" style="display:block;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;text-align:center;font-weight:700;font-size:15px;">Login Now →</a>`;

    await this.transporter.sendMail({
      from: '"HRMPro Enterprise" <hrmtesting461@gmail.com>',
      to: email,
      subject: `Your Company ${companyName} is Now Active on HRMPro`,
      html: this.baseTemplate(`Company Approved`, content, '#059669'),
    });
  }

  async sendPayrollProcessed(email: string, name: string, month: string, netSalary: number) {
    const content = `
      <h2 style="color:#1e293b;font-size:22px;font-weight:800;margin:0 0 8px;">Salary Credited 💰</h2>
      <p style="color:#64748b;font-size:15px;margin:0 0 24px;">Hello <strong>${name}</strong>, your salary for <strong>${month}</strong> has been processed.</p>
      <div style="background:linear-gradient(135deg,#059669,#10b981);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
        <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Net Salary</p>
        <h1 style="color:#ffffff;font-size:42px;font-weight:900;margin:0;">PKR ${netSalary.toLocaleString()}</h1>
        <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:8px 0 0;">${month}</p>
      </div>
      <a href="http://localhost:3001/dashboard/profile" style="display:block;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;text-align:center;font-weight:700;font-size:15px;">View Payslip →</a>`;

    await this.transporter.sendMail({
      from: '"HRMPro Enterprise" <hrmtesting461@gmail.com>',
      to: email,
      subject: `Salary Processed for ${month} - PKR ${netSalary.toLocaleString()}`,
      html: this.baseTemplate(`Salary Processed`, content, '#059669'),
    });
  }

  async sendLeaveStatus(email: string, name: string, status: string, leaveType: string, dates: string) {
    const approved = status === 'approved';
    const content = `
      <h2 style="color:#1e293b;font-size:22px;font-weight:800;margin:0 0 8px;">Leave ${approved ? 'Approved' : 'Rejected'} ${approved ? '✅' : '❌'}</h2>
      <p style="color:#64748b;font-size:15px;margin:0 0 24px;">Hello <strong>${name}</strong>, your leave request has been <strong>${status}</strong>.</p>
      <div style="background:${approved ? '#f0fdf4' : '#fef2f2'};border:1px solid ${approved ? '#86efac' : '#fca5a5'};border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="color:${approved ? '#166534' : '#991b1b'};font-size:15px;font-weight:700;margin:0 0 8px;">${leaveType} Leave</p>
        <p style="color:${approved ? '#15803d' : '#b91c1c'};font-size:13px;margin:0;">${dates}</p>
      </div>
      <a href="http://localhost:3001/dashboard/leaves" style="display:block;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;text-align:center;font-weight:700;font-size:15px;">View Leave Details →</a>`;

    await this.transporter.sendMail({
      from: '"HRMPro Enterprise" <hrmtesting461@gmail.com>',
      to: email,
      subject: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)} - ${leaveType}`,
      html: this.baseTemplate(`Leave ${status}`, content, approved ? '#059669' : '#ef4444'),
    });
  }
}