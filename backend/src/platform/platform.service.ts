import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformLoginDto, CreateCompanyDto, UpdateCompanyDto } from './dto/platform.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PlatformService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) { }

    async login(dto: PlatformLoginDto) {
        const admin = await this.prisma.platformAdmin.findUnique({
            where: { email: dto.email },
        });
        if (!admin) throw new UnauthorizedException('Invalid credentials');
        const isValid = await bcrypt.compare(dto.password, admin.passwordHash);
        if (!isValid) throw new UnauthorizedException('Invalid credentials');
        const token = this.jwtService.sign({
            sub: admin.id, email: admin.email, role: 'PLATFORM_ADMIN',
        });
        return {
            access_token: token,
            admin: { id: admin.id, name: admin.name, email: admin.email, role: 'PLATFORM_ADMIN' },
        };
    }

    async getStats() {
        const [totalCompanies, activeCompanies, inactiveCompanies, totalUsers, totalEmployees] = await Promise.all([
            this.prisma.company.count(),
            this.prisma.company.count({ where: { status: 'active' } }),
            this.prisma.company.count({ where: { status: 'inactive' } }),
            this.prisma.user.count(),
            this.prisma.employee.count(),
        ]);
        return { totalCompanies, activeCompanies, inactiveCompanies, totalUsers, totalEmployees };
    }

    async getCompanies() {
        return this.prisma.company.findMany({
            include: { _count: { select: { users: true, employees: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getAnalytics() {
        const companies = await this.prisma.company.findMany({
            include: {
                _count: { select: { employees: true, users: true, attendance: true, leaves: true, payrolls: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const payrollData = await this.prisma.payroll.groupBy({
            by: ['companyId'],
            _sum: { netSalary: true },
        });

        const attendanceData = await this.prisma.attendance.groupBy({
            by: ['companyId', 'status'],
            _count: true,
        });

        return companies.map(company => {
            const payroll = payrollData.find(p => p.companyId === company.id);
            const presentCount = attendanceData
                .filter(a => a.companyId === company.id && a.status === 'present')
                .reduce((sum, a) => sum + a._count, 0);
            const totalAttendance = attendanceData
                .filter(a => a.companyId === company.id)
                .reduce((sum, a) => sum + a._count, 0);

            return {
                id: company.id,
                name: company.name,
                industry: company.industry,
                status: company.status,
                employees: company._count.employees,
                users: company._count.users,
                leaves: company._count.leaves,
                payrolls: company._count.payrolls,
                totalPayroll: payroll?._sum?.netSalary || 0,
                attendanceRate: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0,
            };
        });
    }

    async getCompanyUsers(companyId: string) {
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new NotFoundException('Company not found');

        const users = await this.prisma.user.findMany({
            where: { companyId },
            select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        return { company, users };
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

        await this.prisma.employee.update({
            where: { id: employeeId },
            data: { companyId: toCompanyId },
        });

        await this.prisma.user.update({
            where: { id: employee.userId },
            data: { companyId: toCompanyId },
        });

        return { message: `Employee transferred to ${toCompany.name} successfully` };
    }

    async createCompany(dto: CreateCompanyDto) {
        const company = await this.prisma.company.create({
            data: {
                name: dto.name,
                industry: dto.industry,
                address: dto.address,
                planId: dto.planId,
                status: 'active',
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

    async updateCompany(id: string, dto: UpdateCompanyDto) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) throw new NotFoundException('Company not found');
        return this.prisma.company.update({ where: { id }, data: dto });
    }

    async deleteCompany(id: string) {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) throw new NotFoundException('Company not found');
        return this.prisma.company.update({ where: { id }, data: { status: 'inactive' } });
    }
}
