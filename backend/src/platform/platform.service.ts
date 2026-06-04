import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformLoginDto, CreateCompanyDto, UpdateCompanyDto } from './dto/platform.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PlatformService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) { }

    async login(dto: PlatformLoginDto) {
        const admin = await this.prisma.platformAdmin.findUnique({ where: { email: dto.email } });
        if (!admin) throw new UnauthorizedException('Invalid credentials');
        const isValid = await bcrypt.compare(dto.password, admin.passwordHash);
        if (!isValid) throw new UnauthorizedException('Invalid credentials');
        const token = this.jwtService.sign({
            sub: admin.id, email: admin.email, role: admin.role,
        });
        return {
            access_token: token,
            admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
        };
    }

    async getStats(adminId: string, adminRole: string) {
        const isSuper = adminRole === 'SUPER_ADMIN';
        const where = isSuper ? {} : { createdById: adminId };
        const [totalCompanies, activeCompanies, inactiveCompanies] = await Promise.all([
            this.prisma.company.count({ where }),
            this.prisma.company.count({ where: { ...where, status: 'active' } }),
            this.prisma.company.count({ where: { ...where, status: 'inactive' } }),
        ]);
        return { totalCompanies, activeCompanies, inactiveCompanies };
    }

    async getCompanies(adminId: string, adminRole: string) {
        const isSuper = adminRole === 'SUPER_ADMIN';
        const where = isSuper ? {} : { createdById: adminId };
        return this.prisma.company.findMany({
            where,
            include: { _count: { select: { users: true, employees: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getCompanyUsers(companyId: string, adminId: string, adminRole: string) {
        const isSuper = adminRole === 'SUPER_ADMIN';
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new NotFoundException('Company not found');
        if (!isSuper && company.createdById !== adminId) {
            throw new ForbiddenException('You can only view users of your own companies');
        }
        const users = await this.prisma.user.findMany({
            where: { companyId },
            select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        return { company, users };
    }

    async createCompany(dto: CreateCompanyDto, adminId: string) {
        const company = await this.prisma.company.create({
            data: {
                name: dto.name,
                industry: dto.industry,
                address: dto.address,
                planId: dto.planId,
                status: 'active',
                createdById: adminId,
            },
        });
        const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
        const adminUser = await this.prisma.user.create({
            data: {
                name: dto.adminName,
                email: dto.adminEmail,
                passwordHash: hashedPassword,
                role: 'COMPANY_ADMIN',
                companyId: company.id,
            },
        });
        return {
            message: 'Company created successfully',
            company,
            admin: { id: adminUser.id, name: adminUser.name, email: adminUser.email },
        };
    }

    async updateCompany(id: string, dto: UpdateCompanyDto, adminId: string, adminRole: string) {
        const isSuper = adminRole === 'SUPER_ADMIN';
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) throw new NotFoundException('Company not found');
        if (!isSuper && company.createdById !== adminId) {
            throw new ForbiddenException('You can only update your own companies');
        }
        return this.prisma.company.update({ where: { id }, data: dto });
    }

    // ✅ HARD DELETE — completely wipes company and all related data from DB
    async deleteCompany(id: string, adminId: string, adminRole: string) {
        const isSuper = adminRole === 'SUPER_ADMIN';
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) throw new NotFoundException('Company not found');
        if (!isSuper && company.createdById !== adminId) {
            throw new ForbiddenException('You can only delete your own companies');
        }

        // Delete in correct order to respect foreign key constraints
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

    // ✅ Reset Company Admin password — platform admin can reset anytime
    async resetCompanyAdminPassword(companyId: string, newPassword: string, adminId: string, adminRole: string) {
        if (!newPassword || newPassword.length < 6) {
            throw new BadRequestException('Password must be at least 6 characters');
        }

        const isSuper = adminRole === 'SUPER_ADMIN';
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new NotFoundException('Company not found');
        if (!isSuper && company.createdById !== adminId) {
            throw new ForbiddenException('You can only reset passwords for your own companies');
        }

        // Find the Company Admin for this company
        const companyAdmin = await this.prisma.user.findFirst({
            where: { companyId, role: 'COMPANY_ADMIN' },
        });
        if (!companyAdmin) throw new NotFoundException('No Company Admin found for this company');

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: companyAdmin.id },
            data: { passwordHash: hashedPassword },
        });

        return { message: `Password reset for ${companyAdmin.name} (${companyAdmin.email})` };
    }

    async transferEmployee(employeeId: string, toCompanyId: string) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
            include: { user: true },
        });
        if (!employee) throw new NotFoundException('Employee not found');
        const toCompany = await this.prisma.company.findUnique({ where: { id: toCompanyId } });
        if (!toCompany) throw new NotFoundException('Target company not found');
        if (employee.companyId === toCompanyId) {
            throw new BadRequestException('Employee already belongs to this company');
        }
        await this.prisma.employee.update({ where: { id: employeeId }, data: { companyId: toCompanyId } });
        await this.prisma.user.update({ where: { id: employee.userId }, data: { companyId: toCompanyId } });
        return { message: `Employee transferred to ${toCompany.name} successfully` };
    }
}
