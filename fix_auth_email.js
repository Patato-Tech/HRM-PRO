const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/auth/auth.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Add imports after bcrypt import
content = content.replace(
  "import * as bcrypt from 'bcryptjs';",
  "import * as bcrypt from 'bcryptjs';\nimport { EmailService } from '../email/email.service';\nimport { OtpService } from '../email/otp.service';"
);

// Add to constructor
content = content.replace(
  'private jwtService: JwtService,\n    ) { }',
  'private jwtService: JwtService,\n        private emailService: EmailService,\n        private otpService: OtpService,\n    ) { }'
);

// Fix findUnique - use findFirst
content = content.replace(
  "const user = await this.prisma.user.findUnique({ where: { email } });",
  "const user = await this.prisma.user.findFirst({ where: { email } });"
);

// Add OTP methods before last closing brace
const otpMethods = 
    async sendForgotPasswordOTP(email: string) {
        const user = await this.prisma.user.findFirst({ where: { email } });
        if (!user) throw new Error('No account found with this email');
        await this.otpService.sendOTP(email, user.name, 'Password Reset');
        return { message: 'OTP sent to your email' };
    }

    async verifyForgotPasswordOTP(email: string, otp: string, newPassword: string) {
        const valid = await this.otpService.verifyOTP(email, otp, 'Password Reset');
        if (!valid) throw new Error('Invalid or expired OTP');
        const hash = await bcrypt.hash(newPassword, 10);
        const user = await this.prisma.user.findFirst({ where: { email } });
        if (user) await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
        return { message: 'Password reset successfully' };
    }
;

content = content.replace(/\}\s*$/, otpMethods + '\n}');

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');