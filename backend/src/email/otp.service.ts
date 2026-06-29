import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(email: string, name: string, purpose: string): Promise<string> {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete old OTPs for this email/purpose
    await this.prisma.oTP.deleteMany({ where: { email, purpose } });

    // Save new OTP
    await this.prisma.oTP.create({
      data: { email, otp, purpose, expiresAt },
    });

    // Send email
    await this.emailService.sendOTP(email, name, otp, purpose);
    return otp;
  }

  async verifyOTP(email: string, otp: string, purpose: string): Promise<boolean> {
    const record = await this.prisma.oTP.findFirst({
      where: { email, otp, purpose, used: false, expiresAt: { gt: new Date() } },
    });

    if (!record) return false;

    await this.prisma.oTP.update({ where: { id: record.id }, data: { used: true } });
    return true;
  }
}