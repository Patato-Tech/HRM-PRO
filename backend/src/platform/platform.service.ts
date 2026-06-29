import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformLoginDto, UpdateCompanyDto } from './dto/platform.dto';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../email/email.service';


@Injectable()
export class PlatformService {
    constructor(private prisma: PrismaService, private jwtService: JwtService, private emailService: EmailService) { }

    async login(dto: PlatformLoginDto) {
        const admin = await this.prisma.platformAdmin.findUnique({ where: { email: dto.email } });
        if (!admin) throw new UnauthorizedException('Invalid credentials');
        const isValid = await bcrypt.compare(dto.password, admin.passwordHash);
        if (!isValid) throw new UnauthorizedException('Invalid credentials');
        const token = this.jwtService.sign({ sub: admin.id, email: admin.email, role: 'PLATFORM_ADMIN' });
        return { access_token: token, admin: { id: admin.id, name: admin.name, email: admin.email, role: 'PLATFORM_ADMIN' } };
    }

    async getStats() {
        const [totalCompanies, activeCompanies, inactiveCompanies, pendingCompanies] = await Promise.all([
            this.prisma.company.count({ where: { status: { not: 'pending' } } }),
            this.prisma.company.count({ where: { status: 'active' } }),
            this.prisma.company.count({ where: { status: 'inactive' } }),
            this.prisma.company.count({ where: { status: 'pending' } }),
        ]);
        return { totalCompanies, activeCompanies, inactiveCompanies, pendingCompanies };
    }

    async getCompanies() {
        return this.prisma.company.findMany({
            where: { status: { not: 'pending' } },
            include: { _count: { select: { users: true, employees: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getPendingCompanies() {
        return this.prisma.company.findMany({
            where: { status: 'pending' },
            include: { _count: { select: { users: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async registerCompany(dto: {
        companyName: string; industry?: string; address?: string;
        city?: string; country?: string; companyPhone?: string;
        website?: string; companySize?: string; regNumber?: string;
        adminName: string; adminEmail: string; adminPassword: string;
    }) {
        const existingUser = await this.prisma.user.findFirst({ where: { email: dto.adminEmail } });
        if (existingUser) throw new BadRequestException('An account with this email already exists');
        const company = await this.prisma.company.create({
            data: { name: dto.companyName, industry: dto.industry, address: dto.address, city: dto.city, country: dto.country, phone: dto.companyPhone, website: dto.website, companySize: dto.companySize, regNumber: dto.regNumber, status: 'pending' },
        });
        const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
        await this.prisma.user.create({
            data: { name: dto.adminName, email: dto.adminEmail, passwordHash: hashedPassword, role: 'COMPANY_ADMIN', companyId: company.id },
        });
        return { message: 'Registration submitted. Pending approval by platform administrator.' };
    }
    async approveCompany(id: number) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) throw new NotFoundException('Company not found');
        if (company.status !== 'pending') throw new BadRequestException('Company is not pending');
        await this.prisma.company.update({ where: { id }, data: { status: 'active' } });

        try {
            const admin = await this.prisma.user.findFirst({ where: { companyId: id, role: "COMPANY_ADMIN" } });
            if (admin) {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                await this.prisma.oTP.create({ data: { email: admin.email, otp, purpose: "Account Activation", expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
                await this.emailService.sendActivationEmail(admin.email, admin.name, company.name, "Check your registration details", otp);
            }
        } catch (e) { console.error("Approval email failed:", e.message); }
        return { message: `${company.name} approved and activated` };
    }

    async rejectCompany(id: number) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) throw new NotFoundException('Company not found');
        await this.prisma.user.deleteMany({ where: { companyId: id } });
        await this.prisma.company.delete({ where: { id } });
        return { message: 'Company registration rejected and removed' };
    }

    async updateCompany(id: number, dto: UpdateCompanyDto) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) throw new NotFoundException('Company not found');
        return this.prisma.company.update({ where: { id }, data: dto });
    }

    async deleteCompany(id: number) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) throw new NotFoundException('Company not found');
        await this.prisma.company.update({ where: { id }, data: { status: 'deleted' } });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.prisma.shiftSchedule.deleteMany({ where: { companyId: id } });
        await this.prisma.deductionRule.deleteMany({ where: { companyId: id } });
        await this.prisma.payroll.deleteMany({ where: { companyId: id } });
        await this.prisma.leaveBalance.deleteMany({ where: { companyId: id } });
        await this.prisma.leave.deleteMany({ where: { companyId: id } });
        await this.prisma.attendance.deleteMany({ where: { companyId: id } });
        await this.prisma.employee.deleteMany({ where: { companyId: id } });
        await this.prisma.department.deleteMany({ where: { companyId: id } });
        await this.prisma.user.deleteMany({ where: { companyId: id } });
        await this.prisma.company.delete({ where: { id } });
        return { message: 'Company permanently deleted' };
    }

    async resetCompanyAdminPassword(companyId: number, newPassword: string) {
        if (!newPassword || newPassword.length < 6) throw new BadRequestException('Password must be at least 6 characters');
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new NotFoundException('Company not found');
        const companyAdmin = await this.prisma.user.findFirst({ where: { companyId, role: 'COMPANY_ADMIN' } });
        if (!companyAdmin) throw new NotFoundException('No Company Admin found');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({ where: { id: companyAdmin.id }, data: { passwordHash: hashedPassword, sessionInvalidatedAt: new Date() } });
        return { message: `Password reset for ${companyAdmin.name} (${companyAdmin.email})` };
    }
}


