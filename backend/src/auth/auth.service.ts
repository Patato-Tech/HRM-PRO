import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        if (dto.role === 'PLATFORM_ADMIN') {
            const existing = await this.prisma.platformAdmin.findUnique({ where: { email: dto.email } });
            if (existing) throw new ConflictException('Admin already exists');

            const hashedPassword = await bcrypt.hash(dto.password, 10);
            const admin = await this.prisma.platformAdmin.create({
                data: { name: dto.name, email: dto.email, passwordHash: hashedPassword },
            });

            const token = this.jwtService.sign({
                sub: admin.id, email: admin.email, role: 'PLATFORM_ADMIN',
            });

            return {
                message: 'Platform admin registered successfully',
                access_token: token,
                user: { id: admin.id, name: admin.name, email: admin.email, role: 'PLATFORM_ADMIN' },
            };
        }

        const companyId = Number(dto.companyId);
        const existingUser = await this.prisma.user.findFirst({
            where: { email: dto.email, companyId },
        });
        if (existingUser) throw new ConflictException('User already exists');

        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new ConflictException('Company not found');
        if (company.status === 'pending') throw new UnauthorizedException('pending approval: Your account is pending approval by the platform administrator.');
        if (company.status === 'inactive') throw new UnauthorizedException('Your company account has been deactivated.');

        if (dto.actorRole) {
            const allowedCreations: Record<string, string[]> = {
                COMPANY_ADMIN: ['HR_MANAGER', 'DEPT_MANAGER'],
                HR_MANAGER: ['DEPT_MANAGER', 'EMPLOYEE'],
                DEPT_MANAGER: ['EMPLOYEE'],
            };
            const allowed = allowedCreations[dto.actorRole] || [];
            if (!allowed.includes(dto.role || 'EMPLOYEE')) {
                throw new ForbiddenException(`${dto.actorRole} cannot create ${dto.role}`);
            }
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash: hashedPassword,
                role: dto.role || 'EMPLOYEE',
                companyId,
            },
        });

        const token = this.jwtService.sign({
            sub: user.id, email: user.email, role: user.role, companyId: user.companyId,
        });

        return {
            message: 'User registered successfully',
            access_token: token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId },
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findFirst({ where: { email: dto.email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');
        if (!user.isActive) throw new UnauthorizedException('Your account is deactivated');

        const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
        if (company && company.status === 'pending') {
            throw new UnauthorizedException('Your account is pending approval by the platform administrator.');
        }
        if (company && company.status === 'inactive') {
            throw new UnauthorizedException('Your company has been deactivated');
        }
        if (user.name && user.name.startsWith('DELETED:')) {
            throw new UnauthorizedException('COMPANY_DELETED: Your company account has been permanently deleted. Please contact the platform administrator.');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

        const employee = await this.prisma.employee.findUnique({
            where: { userId: user.id },
            include: { customRole: true, department: true },
        });

        const permissions = employee?.customRole?.permissions || null;
        const customRoleName = employee?.customRole?.name || null;
        const customRoleScope = employee?.customRole?.scope || null;

        const token = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            employeeId: employee?.id || null,
            departmentId: employee?.departmentId || null,
            permissions,
            customRoleScope,
        });

        return {
            message: 'Login successful',
            access_token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
                companyName: company?.name || '',
                employeeId: employee?.id || null,
                departmentId: employee?.departmentId || null,
                departmentName: employee?.department?.name || null,
                designation: employee?.designation || null,
                customRoleName,
                permissions,
                customRoleScope,
            },
        };
    }

    async getProfile(userId: number, tokenIat?: number) {
        const iat = tokenIat;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, companyId: true, isActive: true, createdAt: true, sessionInvalidatedAt: true },
        });
        if (!user) throw new UnauthorizedException('User not found');
        if (!user.isActive) throw new UnauthorizedException('Your account is deactivated');
        if (iat && user.sessionInvalidatedAt) {
            const tokenIssuedAt = new Date(iat * 1000);
            if (user.sessionInvalidatedAt > tokenIssuedAt) {
                throw new UnauthorizedException('SESSION_INVALIDATED: Your password has been changed by the platform administrator.');
            }
        }
        if (user.companyId) {
            const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
            if (!company || company.status === 'deleted') throw new UnauthorizedException('COMPANY_DELETED: Your company has been permanently deleted.');
            if (company.status === 'inactive') throw new UnauthorizedException('COMPANY_DEACTIVATED: Your company has been deactivated by the platform administrator.');
            if (company.status === 'pending') throw new UnauthorizedException('pending approval: Your company account is awaiting platform administrator approval.');
        }

        const employee = await this.prisma.employee.findUnique({
            where: { userId },
            include: { department: true },
        });

        return { ...user, employee };
    }

    async updateProfile(userId: number, name: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { name },
            select: { id: true, name: true, email: true, role: true },
        });
    }

    async updatePassword(userId: number, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('User not found');

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) throw new UnauthorizedException('Current password is incorrect');

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hashedPassword },
        });

        return { message: 'Password updated successfully' };
    }

    async updateCompanyInfo(companyId: number, dto: any) {
        return this.prisma.company.update({
            where: { id: companyId },
            data: {
                name: dto.name,
                industry: dto.industry,
                address: dto.address,
                city: dto.city,
                country: dto.country,
                phone: dto.phone,
                website: dto.website,
                companySize: dto.companySize,
                regNumber: dto.regNumber,
            },
        });
    }
    async getCompanyInfo(companyId: number) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { id: true, name: true, industry: true, address: true, city: true, country: true, phone: true, website: true, companySize: true, regNumber: true, logo: true, status: true, createdAt: true },
        });
        if (!company) throw new UnauthorizedException('Company not found');
        return company;
    }

    async getCompanyStatusByEmail(email: string) {
        if (!email) return { status: 'unknown' };
        const user = await this.prisma.user.findFirst({
            where: { email },
            include: { company: { select: { status: true, name: true } } }
        });
        if (!user) return { status: 'unknown' };
        return { status: (user as any).company?.status || 'unknown', companyName: (user as any).company?.name };
    }
}



