const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/auth/auth.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix sendForgotPasswordOTP to not require existing user
content = content.replace(
  "    async sendForgotPasswordOTP(email: string) {\n        const user = await this.prisma.user.findFirst({ where: { email } });\n        if (!user) throw new Error('No account found with this email');\n        await this.otpService.sendOTP(email, user.name, 'Password Reset');\n        return { message: 'OTP sent to your email' };\n    }",
  "    async sendForgotPasswordOTP(email: string) {\n        const user = await this.prisma.user.findFirst({ where: { email } });\n        const name = user?.name || 'User';\n        await this.otpService.sendOTP(email, name, 'Password Reset');\n        return { message: 'OTP sent to your email' };\n    }"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');