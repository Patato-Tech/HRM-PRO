const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/auth/auth.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'constructor(\n        private prisma: PrismaService,\n        private jwtService: JwtService,\n    ) { }',
  'constructor(\n        private prisma: PrismaService,\n        private jwtService: JwtService,\n        private emailService: EmailService,\n        private otpService: OtpService,\n    ) { }'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');