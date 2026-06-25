const fs = require('fs');

const serviceFile = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/auth/auth.service.ts';
let service = fs.readFileSync(serviceFile, 'utf8');

const lines = [
  '    async forgotPassword(email: string) {',
  '        const user = await this.prisma.user.findFirst({ where: { email } });',
  '        if (!user) return { message: "If this email exists, a reset link will be sent." };',
  '        const resetToken = Math.random().toString(36).substring(2,15) + Math.random().toString(36).substring(2,15);',
  '        const resetExpiry = new Date(Date.now() + 3600000);',
  '        await this.prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiry: resetExpiry } });',
  '        return { message: "Password reset token generated.", resetToken, email: user.email };',
  '    }',
  '    async resetPassword(token: string, newPassword: string) {',
  '        const user = await this.prisma.user.findFirst({ where: { resetToken: token } });',
  '        if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) throw new Error("Invalid or expired reset token.");',
  '        const hashedPassword = await bcrypt.hash(newPassword, 10);',
  '        await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashedPassword, resetToken: null, resetTokenExpiry: null } });',
  '        return { message: "Password reset successfully." };',
  '    }',
];

const fn = lines.join('\n');
service = service.replace('    async getCompanyInfo', fn + '\n    async getCompanyInfo');
fs.writeFileSync(serviceFile, service, 'utf8');
console.log('Auth service done!');