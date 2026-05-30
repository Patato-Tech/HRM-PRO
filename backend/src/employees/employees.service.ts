import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EmployeesService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: string) {
        return this.prisma.employee.findMany({
            where: { companyId },
            include: {
                user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
                department: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getStats(companyId: string) {
        const [total, active, inactive] = await Promise.all([
            this.prisma.employee.count({ where: { companyId } }),
            this.prisma.employee.count({ where: { companyId, status: 'active' } }),
            this.prisma.employee.count({ where: { companyId, status: 'inactive' } }),
        ]);
        return { total, active, inactive };
    }

    async findOne(id: string, companyId: string) {
        const employee = await this.prisma.employee.findFirst({
            where: { id, companyId },
            include: {
                user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
                department: true,
            },
        });
        if (!employee) throw new NotFoundException('Employee not found');
        return employee;
    }

    async create(dto: CreateEmployeeDto, companyId: string) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const count = await this.prisma.employee.count({ where: { companyId } });
        const employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;

        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash: hashedPassword,
                role: dto.role || 'EMPLOYEE',
                companyId,
            },
        });

        const employee = await this.prisma.employee.create({
            data: {
                companyId,
                userId: user.id,
                employeeCode,
                designation: dto.designation,
                departmentId: dto.departmentId,
                salary: dto.salary || 0,
            },
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
                department: true,
            },
        });

        return employee;
    }

    async update(id: string, dto: UpdateEmployeeDto, companyId: string) {
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');

        if (dto.name) {
            await this.prisma.user.update({
                where: { id: employee.userId },
                data: { name: dto.name },
            });
        }

        return this.prisma.employee.update({
            where: { id },
            data: {
                designation: dto.designation,
                departmentId: dto.departmentId,
                salary: dto.salary,
                status: dto.status,
            },
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
                department: true,
            },
        });
    }

    async deactivate(id: string, companyId: string) {
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');

        await this.prisma.user.update({
            where: { id: employee.userId },
            data: { isActive: false },
        });

        return this.prisma.employee.update({
            where: { id },
            data: { status: 'inactive' },
        });
    }

    async remove(id: string, companyId: string) {
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');
        await this.prisma.employee.delete({ where: { id } });
        await this.prisma.user.delete({ where: { id: employee.userId } });
        return { message: 'Employee deleted successfully' };
    }
}
