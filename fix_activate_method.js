const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/auth/auth.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Add activate account method
content = content.replace(
  "    async sendForgotPasswordOTP",
  "    async activateAccount(email: string, otp: string) {\n        const valid = await this.otpService.verifyOTP(email, otp, 'Account Activation');\n        if (!valid) throw new Error('Invalid or expired OTP');\n        const user = await this.prisma.user.findFirst({ where: { email } });\n        if (user) await this.prisma.user.update({ where: { id: user.id }, data: { isActivated: true } });\n        return { message: 'Account activated successfully' };\n    }\n\n    async sendForgotPasswordOTP"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');