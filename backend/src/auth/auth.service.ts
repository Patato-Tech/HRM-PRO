import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
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
            const existing = await this.prisma.platformAdmin.findUnique({
                where: { email: dto.email },
            });
            if (existing) throw new ConflictException('Admin with this email already exists');

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

        const existingUser = await this.prisma.user.findFirst({
            where: { email: dto.email, companyId: dto.companyId },
        });
        if (existingUser) throw new ConflictException('User already exists');

        const company = await this.prisma.company.findUnique({
            where: { id: dto.companyId },
        });
        if (!company) throw new ConflictException('Company not found. Check your Company ID');
        if (company.status === 'inactive') throw new UnauthorizedException('Company is deactivated');

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash: hashedPassword,
                role: dto.role || 'EMPLOYEE',
                companyId: dto.companyId,
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
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email },
        });
        if (!user) throw new UnauthorizedException('Invalid credentials');
        if (!user.isActive) throw new UnauthorizedException('Your account is deactivated');

        const company = await this.prisma.company.findUnique({
            where: { id: user.companyId },
        });
        if (company && company.status === 'inactive') {
            throw new UnauthorizedException('Your company has been deactivated');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

        const token = this.jwtService.sign({
            sub: user.id, email: user.email, role: user.role, companyId: user.companyId,
        });

        return {
            message: 'Login successful',
            access_token: token,
            user: {
                id: user.id, name: user.name, email: user.email,
                role: user.role, companyId: user.companyId,
                companyName: company?.name || '',
            },
        };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, companyId: true, isActive: true, createdAt: true },
        });
        if (!user) throw new UnauthorizedException('User not found');
        return user;
    }

    async getCompanyInfo(companyId: string) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { id: true, name: true, industry: true, address: true, status: true, createdAt: true },
        });
        if (!company) throw new UnauthorizedException('Company not found');
        return company;
    }
}
