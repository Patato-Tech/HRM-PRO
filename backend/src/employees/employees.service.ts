import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EmployeesService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: string, actorRole: string, actorDeptId: string | null, actorEmployeeId: string | null) {
        // ✅ EMPLOYEE: sees ONLY their own record
        if (actorRole === 'EMPLOYEE') {
            if (!actorEmployeeId) return [];
            const emp = await this.prisma.employee.findFirst({
                where: { id: actorEmployeeId, companyId },
                include: {
                    user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
                    department: true,
                },
            });
            // Return as array but strip salary (employee sees own record but not salary of others)
            return emp ? [emp] : [];
        }

        const where: any = { companyId };

        // Dept Manager sees only own department
        if (actorRole === 'DEPT_MANAGER' && actorDeptId) {
            where.departmentId = actorDeptId;
        }

        const employees = await this.prisma.employee.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
                department: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Dept Manager cannot see salary
        if (actorRole === 'DEPT_MANAGER') {
            return employees.map(emp => ({ ...emp, salary: undefined }));
        }

        return employees;
    }

    async getStats(companyId: string) {
        const [total, active, inactive] = await Promise.all([
            this.prisma.employee.count({ where: { companyId } }),
            this.prisma.employee.count({ where: { companyId, status: 'active' } }),
            this.prisma.employee.count({ where: { companyId, status: 'inactive' } }),
        ]);
        return { total, active, inactive };
    }

    async findOne(id: string, companyId: string, actorRole: string, actorDeptId: string | null, actorEmployeeId: string | null) {
        // Employee can only see their own
        if (actorRole === 'EMPLOYEE' && actorEmployeeId !== id) {
            throw new ForbiddenException('Access denied');
        }

        const employee = await this.prisma.employee.findFirst({
            where: { id, companyId },
            include: {
                user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
                department: true,
            },
        });
        if (!employee) throw new NotFoundException('Employee not found');

        if (actorRole === 'DEPT_MANAGER' && actorDeptId && employee.departmentId !== actorDeptId) {
            throw new ForbiddenException('Access denied to this employee');
        }

        if (actorRole === 'DEPT_MANAGER') {
            return { ...employee, salary: undefined };
        }

        return employee;
    }

    async create(dto: CreateEmployeeDto, companyId: string, actorRole: string, actorDeptId: string | null) {
        // ✅ Dept Manager CANNOT add employees
        if (actorRole === 'DEPT_MANAGER') {
            throw new ForbiddenException('Department Managers cannot add new employees');
        }

        const allowedCreations: Record<string, string[]> = {
            COMPANY_ADMIN: ['HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
            HR_MANAGER: ['DEPT_MANAGER', 'EMPLOYEE'],
        };
        const allowed = allowedCreations[actorRole] || [];
        const targetRole = dto.role || 'EMPLOYEE';

        if (!allowed.includes(targetRole)) {
            throw new ForbiddenException(`${actorRole} cannot create ${targetRole}`);
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const count = await this.prisma.employee.count({ where: { companyId } });
        const employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;

        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash: hashedPassword,
                role: targetRole,
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

    async update(id: string, dto: UpdateEmployeeDto, companyId: string, actorRole: string, actorDeptId: string | null) {
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');

        if (actorRole === 'DEPT_MANAGER') {
            if (employee.departmentId !== actorDeptId) {
                throw new ForbiddenException('Access denied to this employee');
            }
            delete dto.salary;
        }

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

    async resetPassword(id: string, newPassword: string, companyId: string, actorRole: string, actorDeptId: string | null) {
        if (!newPassword || newPassword.length < 6) {
            throw new BadRequestException('Password must be at least 6 characters');
        }

        const employee = await this.prisma.employee.findFirst({
            where: { id, companyId },
            include: { user: { select: { id: true, role: true } } },
        });
        if (!employee) throw new NotFoundException('Employee not found');

        const allowedTargets: Record<string, string[]> = {
            COMPANY_ADMIN: ['HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
            HR_MANAGER: ['DEPT_MANAGER', 'EMPLOYEE'],
            DEPT_MANAGER: ['EMPLOYEE'],
        };
        const allowed = allowedTargets[actorRole] || [];
        if (!allowed.includes(employee.user.role)) {
            throw new ForbiddenException(`${actorRole} cannot reset password for ${employee.user.role}`);
        }

        if (actorRole === 'DEPT_MANAGER' && actorDeptId && employee.departmentId !== actorDeptId) {
            throw new ForbiddenException('Access denied to this employee');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: employee.userId },
            data: { passwordHash: hashedPassword },
        });

        return { message: 'Password reset successfully' };
    }

    // ✅ Salary increment — Company Admin and HR Manager only
    async incrementSalary(employeeId: string, amount: number, companyId: string, actorRole: string) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) {
            throw new ForbiddenException('Only Company Admin and HR Manager can increment salaries');
        }
        if (!amount || amount <= 0) throw new BadRequestException('Increment amount must be positive');

        const employee = await this.prisma.employee.findFirst({
            where: { id: employeeId, companyId },
            include: { user: { select: { role: true, name: true } } },
        });
        if (!employee) throw new NotFoundException('Employee not found');

        const allowedTargets: Record<string, string[]> = {
            COMPANY_ADMIN: ['HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
            HR_MANAGER: ['DEPT_MANAGER', 'EMPLOYEE'],
        };
        if (!allowedTargets[actorRole]?.includes(employee.user.role)) {
            throw new ForbiddenException(`${actorRole} cannot increment salary for ${employee.user.role}`);
        }

        return this.prisma.employee.update({
            where: { id: employeeId },
            data: { salary: { increment: amount } },
            include: { user: { select: { id: true, name: true, role: true } } },
        });
    }

    async deactivate(id: string, companyId: string) {
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');
        await this.prisma.user.update({ where: { id: employee.userId }, data: { isActive: false } });
        return this.prisma.employee.update({ where: { id }, data: { status: 'inactive' } });
    }

    async remove(id: string, companyId: string) {
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');
        await this.prisma.employee.delete({ where: { id } });
        await this.prisma.user.delete({ where: { id: employee.userId } });
        return { message: 'Employee deleted successfully' };
    }
}
