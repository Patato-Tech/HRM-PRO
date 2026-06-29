import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { OtpService } from './otp.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EmailService, OtpService],
  exports: [EmailService, OtpService],
})
export class EmailModule {}