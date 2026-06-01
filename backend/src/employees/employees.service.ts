import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import * as bcrypt from 'bcryptjs';

// Who can create which role
const PROVISIONING_RULES: Record<string, string[]> = {
    COMPANY_ADMIN: ['HR_MANAGER', 'DEPT_MANAGER'],
    HR_MANAGER: ['DEPT_MANAGER', 'EMPLOYEE'],
    DEPT_MANAGER: ['EMPLOYEE'],
};

// Who can reset password of which role
const PASSWORD_RESET_RULES: Record<string, string[]> = {
    COMPANY_ADMIN: ['HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    HR_MANAGER: ['EMPLOYEE'],
    DEPT_MANAGER: ['EMPLOYEE'],
};

// Who can increment salary of which role
const SALARY_INCREMENT_RULES: Record<string, string[]> = {
    COMPANY_ADMIN: ['HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    HR_MANAGER: ['DEPT_MANAGER', 'EMPLOYEE'],
};

const SAFE_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true,
};

@Injectable()
export class EmployeesService {
    constructor(private prisma: PrismaService) { }

    // ─────────────────────────────────────────────
    // FIND ALL — scoped by role
    // ─────────────────────────────────────────────
    async findAll(
        companyId: string,
        actorRole: string,
        actorUserId: string,
        actorDepartmentId: string | null,
    ) {
        // Employee: only own record
        if (actorRole === 'EMPLOYEE') {
            const emp = await this.prisma.employee.findFirst({
                where: { companyId, userId: actorUserId },
                include: {
                    user: { select: { id: true, name: true, email: true, isActive: true } },
                    department: { select: { id: true, name: true } },
                },
            });
            return emp ? [emp] : [];
        }

        // Dept Manager: own department only, no salary
        if (actorRole === 'DEPT_MANAGER') {
            if (!actorDepartmentId) return [];
            const employees = await this.prisma.employee.findMany({
                where: { companyId, departmentId: actorDepartmentId },
                include: {
                    user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
                    department: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
            // Strip salary for dept manager
            return employees.map(({ salary, ...rest }) => rest);
        }

        // Company Admin + HR: full company
        return this.prisma.employee.findMany({
            where: { companyId },
            include: {
                user: { select: SAFE_USER_SELECT },
                department: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ─────────────────────────────────────────────
    // GET STATS — scoped by role
    // ─────────────────────────────────────────────
    async getStats(
        companyId: string,
        actorRole: string,
        actorDepartmentId: string | null,
    ) {
        const where: any = { companyId };
        if (actorRole === 'DEPT_MANAGER' && actorDepartmentId) {
            where.departmentId = actorDepartmentId;
        }

        const [total, active, inactive] = await Promise.all([
            this.prisma.employee.count({ where }),
            this.prisma.employee.count({ where: { ...where, status: 'active' } }),
            this.prisma.employee.count({ where: { ...where, status: 'inactive' } }),
        ]);

        return { total, active, inactive };
    }

    // ─────────────────────────────────────────────
    // FIND ONE — scoped by role
    // ─────────────────────────────────────────────
    async findOne(
        id: string,
        companyId: string,
        actorRole: string,
        actorUserId: string,
        actorDepartmentId: string | null,
    ) {
        const employee = await this.prisma.employee.findFirst({
            where: { id, companyId },
            include: {
                user: { select: SAFE_USER_SELECT },
                department: true,
            },
        });
        if (!employee) throw new NotFoundException('Employee not found');

        // Employee: own only
        if (actorRole === 'EMPLOYEE' && employee.userId !== actorUserId) {
            throw new ForbiddenException('You can only view your own profile.');
        }

        // Dept Manager: own department only
        if (actorRole === 'DEPT_MANAGER' && employee.departmentId !== actorDepartmentId) {
            throw new ForbiddenException('You can only view employees in your department.');
        }

        // Strip salary for Dept Manager
        if (actorRole === 'DEPT_MANAGER') {
            const { salary, ...rest } = employee as any;
            return rest;
        }

        return employee;
    }

    // ─────────────────────────────────────────────
    // CREATE — with provisioning rules
    // ─────────────────────────────────────────────
    async create(
        dto: CreateEmployeeDto,
        companyId: string,
        actorRole: string,
        actorDepartmentId: string | null,
    ) {
        const targetRole = dto.role || 'EMPLOYEE';

        // Provisioning check
        const allowed = PROVISIONING_RULES[actorRole] ?? [];
        if (!allowed.includes(targetRole)) {
            throw new ForbiddenException(
                `A ${actorRole} cannot create a user with role ${targetRole}.`,
            );
        }

        // Dept Manager: own department only
        if (actorRole === 'DEPT_MANAGER') {
            if (!dto.departmentId || dto.departmentId !== actorDepartmentId) {
                throw new ForbiddenException(
                    'Department Managers can only add employees to their own department.',
                );
            }
        }

        const salary = actorRole === 'DEPT_MANAGER' ? 0 : (dto.salary || 0);
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

        return this.prisma.employee.create({
            data: {
                companyId,
                userId: user.id,
                employeeCode,
                designation: dto.designation,
                departmentId: dto.departmentId,
                salary,
            },
            include: {
                user: { select: SAFE_USER_SELECT },
                department: true,
            },
        });
    }

    // ─────────────────────────────────────────────
    // UPDATE — scoped restrictions
    // ─────────────────────────────────────────────
    async update(
        id: string,
        dto: UpdateEmployeeDto,
        companyId: string,
        actorRole: string,
        actorDepartmentId: string | null,
    ) {
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');

        if (actorRole === 'EMPLOYEE') {
            throw new ForbiddenException('Employees cannot update records.');
        }

        if (actorRole === 'DEPT_MANAGER') {
            if (employee.departmentId !== actorDepartmentId) {
                throw new ForbiddenException('You can only manage employees in your department.');
            }
            if (dto.salary !== undefined || dto.departmentId !== undefined) {
                throw new ForbiddenException('Department Managers cannot change salary or department.');
            }
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
                departmentId: actorRole === 'DEPT_MANAGER' ? undefined : dto.departmentId,
                salary: actorRole === 'DEPT_MANAGER' ? undefined : dto.salary,
                status: dto.status,
            },
            include: {
                user: { select: SAFE_USER_SELECT },
                department: true,
            },
        });
    }

    // ─────────────────────────────────────────────
    // INCREMENT SALARY
    // Company Admin → HR, Dept Manager, Employee
    // HR Manager    → Dept Manager, Employee only
    // ─────────────────────────────────────────────
    async incrementSalary(
        id: string,
        amount: number,
        companyId: string,
        actorRole: string,
    ) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) {
            throw new ForbiddenException('Only Company Admin and HR can increment salaries.');
        }

        if (!amount || amount <= 0) {
            throw new BadRequestException('Increment amount must be a positive number.');
        }

        const employee = await this.prisma.employee.findFirst({
            where: { id, companyId },
            include: { user: { select: { role: true } } },
        });
        if (!employee) throw new NotFoundException('Employee not found');

        const targetRole = employee.user.role;
        const allowed = SALARY_INCREMENT_RULES[actorRole] ?? [];

        if (!allowed.includes(targetRole)) {
            throw new ForbiddenException(
                `A ${actorRole} cannot increment salary for a ${targetRole}.`,
            );
        }

        return this.prisma.employee.update({
            where: { id },
            data: { salary: { increment: amount } },
            include: {
                user: { select: SAFE_USER_SELECT },
                department: { select: { id: true, name: true } },
            },
        });
    }

    // ─────────────────────────────────────────────
    // RESET PASSWORD
    // Company Admin → HR, Dept Manager, Employee
    // HR Manager    → Employee only
    // Dept Manager  → own dept Employee only
    // ─────────────────────────────────────────────
    async resetPassword(
        id: string,
        newPassword: string,
        companyId: string,
        actorRole: string,
        actorDepartmentId: string | null,
    ) {
        if (!newPassword || newPassword.length < 6) {
            throw new BadRequestException('Password must be at least 6 characters.');
        }

        const employee = await this.prisma.employee.findFirst({
            where: { id, companyId },
            include: { user: { select: { id: true, role: true } } },
        });
        if (!employee) throw new NotFoundException('Employee not found');

        const targetRole = employee.user.role;
        const allowed = PASSWORD_RESET_RULES[actorRole] ?? [];

        if (!allowed.includes(targetRole)) {
            throw new ForbiddenException(
                `A ${actorRole} cannot reset password for a ${targetRole}.`,
            );
        }

        // Dept Manager: own dept only
        if (actorRole === 'DEPT_MANAGER' && employee.departmentId !== actorDepartmentId) {
            throw new ForbiddenException('You can only reset passwords for employees in your department.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.prisma.user.update({
            where: { id: employee.userId },
            data: { passwordHash: hashedPassword },
        });

        return { message: 'Password reset successfully.' };
    }

    // ─────────────────────────────────────────────
    // DEACTIVATE
    // ─────────────────────────────────────────────
    async deactivate(
        id: string,
        companyId: string,
        actorRole: string,
        actorDepartmentId: string | null,
    ) {
        if (actorRole === 'EMPLOYEE') {
            throw new ForbiddenException('Employees cannot deactivate accounts.');
        }

        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');

        if (actorRole === 'DEPT_MANAGER' && employee.departmentId !== actorDepartmentId) {
            throw new ForbiddenException('You can only deactivate employees in your department.');
        }

        await this.prisma.user.update({
            where: { id: employee.userId },
            data: { isActive: false },
        });

        return this.prisma.employee.update({
            where: { id },
            data: { status: 'inactive' },
        });
    }

    // ─────────────────────────────────────────────
    // DELETE — Company Admin + HR only
    // ─────────────────────────────────────────────
    async remove(id: string, companyId: string, actorRole: string) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) {
            throw new ForbiddenException('Only Company Admin or HR can delete employees.');
        }

        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');

        await this.prisma.employee.delete({ where: { id } });
        await this.prisma.user.delete({ where: { id: employee.userId } });
        return { message: 'Employee deleted successfully' };
    }
}
