const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/auth/auth.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Add imports
content = content.replace(
  "import * as bcrypt from 'bcryptjs';",
  "import * as bcrypt from 'bcryptjs';\nimport { EmailService } from '../email/email.service';\nimport { OtpService } from '../email/otp.service';"
);

// Add to constructor
content = content.replace(
  'private jwtService: JwtService,\n    ) { }',
  'private jwtService: JwtService,\n        private emailService: EmailService,\n        private otpService: OtpService,\n    ) { }'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Step 1 done!');