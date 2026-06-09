import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import * as bcrypt from 'bcryptjs';

const PROVISIONING_RULES: Record<string, string[]> = {
    COMPANY_ADMIN: ['HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    HR_MANAGER: ['DEPT_MANAGER', 'EMPLOYEE'],
    DEPT_MANAGER: ['EMPLOYEE'],
};
const PASSWORD_RESET_RULES: Record<string, string[]> = {
    COMPANY_ADMIN: ['HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    HR_MANAGER: ['EMPLOYEE'],
    DEPT_MANAGER: ['EMPLOYEE'],
};
const SALARY_INCREMENT_RULES: Record<string, string[]> = {
    COMPANY_ADMIN: ['HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    HR_MANAGER: ['DEPT_MANAGER', 'EMPLOYEE'],
};
const SAFE_USER_SELECT = { id: true, name: true, email: true, role: true, isActive: true };

@Injectable()
export class EmployeesService {
    constructor(private prisma: PrismaService) { }

    async findAll(
        companyId: number,
        actorRole: string,
        actorUserId: number,
        actorDepartmentId: number | null,
        customRoleScope?: string | null,
    ) {
        // ✅ Company Admin — full access
        if (actorRole === 'COMPANY_ADMIN') {
            return this.prisma.employee.findMany({
                where: { companyId },
                include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },
                orderBy: { createdAt: 'desc' },
            });
        }

        // ✅ Custom role with scope "own_department" — own department only, no salary
        if (customRoleScope === 'own_department' && actorDepartmentId) {
            const employees = await this.prisma.employee.findMany({
                where: { companyId, departmentId: actorDepartmentId },
                include: {
                    user: { select: SAFE_USER_SELECT },
                    department: { select: { id: true, name: true } },
                    customRole: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            return employees.map(({ salary, ...rest }) => rest);
        }

        // ✅ Custom role with scope "all" — full company view
        if (customRoleScope === 'all') {
            return this.prisma.employee.findMany({
                where: { companyId },
                include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },
                orderBy: { createdAt: 'desc' },
            });
        }

        // ✅ Plain employee (no custom role) — own record only
        const emp = await this.prisma.employee.findFirst({
            where: { companyId, userId: actorUserId },
            include: {
                user: { select: { id: true, name: true, email: true, isActive: true } },
                department: { select: { id: true, name: true } },
                customRole: true,
            },
        });
        return emp ? [emp] : [];
    }

    async getStats(companyId: number, actorRole: string, actorDepartmentId: number | null, customRoleScope?: string | null) {
        const where: any = { companyId };
        if (customRoleScope === 'own_department' && actorDepartmentId) where.departmentId = actorDepartmentId;
        if (actorRole !== 'COMPANY_ADMIN' && !customRoleScope && actorDepartmentId) where.departmentId = actorDepartmentId;
        const [total, active, inactive, withRoles] = await Promise.all([
            this.prisma.employee.count({ where }),
            this.prisma.employee.count({ where: { ...where, status: 'active' } }),
            this.prisma.employee.count({ where: { ...where, status: 'inactive' } }),
            this.prisma.employee.count({ where: { ...where, roleId: { not: null } } }),
        ]);
        const withoutRoles = total - withRoles;
        return { total, active, inactive, withRoles, withoutRoles };
    }

    async findOne(id: number, companyId: number, actorRole: string, actorUserId: number, actorDepartmentId: number | null) {
        const employee = await this.prisma.employee.findFirst({
            where: { id, companyId },
            include: { user: { select: SAFE_USER_SELECT }, department: true },
        });
        if (!employee) throw new NotFoundException('Employee not found');
        if (actorRole === 'EMPLOYEE' && employee.userId !== actorUserId) throw new ForbiddenException('You can only view your own profile.');
        if (actorRole === 'DEPT_MANAGER' && employee.departmentId !== actorDepartmentId) throw new ForbiddenException('You can only view employees in your department.');
        if (actorRole === 'DEPT_MANAGER') { const { salary, ...rest } = employee as any; return rest; }
        return employee;
    }

    async create(dto: CreateEmployeeDto, companyId: number, actorRole: string, actorDepartmentId: number | null) {
        const targetRole = dto.role || 'EMPLOYEE';
        const allowed = PROVISIONING_RULES[actorRole] ?? [];
        if (!allowed.includes(targetRole)) throw new ForbiddenException(`A ${actorRole} cannot create a user with role ${targetRole}.`);

        if (targetRole === 'HR_MANAGER') {
            const existingHR = await this.prisma.user.findFirst({ where: { companyId, role: 'HR_MANAGER' } });
            if (existingHR) throw new ForbiddenException('A company can only have one HR Manager.');
            dto.departmentId = undefined;
        }

        if (targetRole === 'DEPT_MANAGER' && dto.departmentId) {
            const deptId = Number(dto.departmentId);
            const existing = await this.prisma.user.findFirst({
                where: { companyId, role: 'DEPT_MANAGER', employee: { departmentId: deptId } },
                include: { employee: true },
            });
            if (existing) throw new ForbiddenException('This department already has a Department Manager.');
        }

        if (actorRole === 'DEPT_MANAGER') {
            const deptId = dto.departmentId ? Number(dto.departmentId) : null;
            if (!deptId || deptId !== actorDepartmentId) throw new ForbiddenException('Department Managers can only add employees to their own department.');
        }

        const salary = actorRole === 'DEPT_MANAGER' ? 0 : (dto.salary || 0);
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const count = await this.prisma.employee.count({ where: { companyId } });
        const employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;

        const user = await this.prisma.user.create({
            data: { name: dto.name, email: dto.email, passwordHash: hashedPassword, role: targetRole, companyId },
        });

        const deptId = dto.departmentId ? Number(dto.departmentId) : null;
        const roleId = dto.roleId ? Number(dto.roleId) : null;
        return this.prisma.employee.create({
            data: { companyId, userId: user.id, employeeCode, designation: dto.designation, departmentId: deptId, salary, roleId },
            include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },
        });
    }

    async update(id: number, dto: UpdateEmployeeDto, companyId: number, actorRole: string, actorDepartmentId: number | null) {
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');
        if (actorRole === 'EMPLOYEE') throw new ForbiddenException('Employees cannot update records.');
        if (actorRole === 'DEPT_MANAGER') {
            if (employee.departmentId !== actorDepartmentId) throw new ForbiddenException('You can only manage employees in your department.');
            if (dto.salary !== undefined || dto.departmentId !== undefined) throw new ForbiddenException('Department Managers cannot change salary or department.');
        }
        if (dto.name) await this.prisma.user.update({ where: { id: employee.userId }, data: { name: dto.name } });
        const deptId = dto.departmentId ? Number(dto.departmentId) : undefined;
        const updateRoleId = dto.roleId !== undefined ? (dto.roleId ? Number(dto.roleId) : null) : undefined;
        return this.prisma.employee.update({
            where: { id },
            data: {
                designation: dto.designation,
                departmentId: actorRole === 'DEPT_MANAGER' ? undefined : (deptId !== undefined ? deptId : null),
                salary: actorRole === 'DEPT_MANAGER' ? undefined : dto.salary,
                status: dto.status,
                roleId: actorRole === 'COMPANY_ADMIN' ? updateRoleId : undefined,
            },
            include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },
        });
    }

    async incrementSalary(id: number, amount: number, companyId: number, actorRole: string) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) throw new ForbiddenException('Only Company Admin and HR can increment salaries.');
        if (!amount || amount <= 0) throw new BadRequestException('Increment amount must be a positive number.');
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId }, include: { user: { select: { role: true } } } });
        if (!employee) throw new NotFoundException('Employee not found');
        const allowed = SALARY_INCREMENT_RULES[actorRole] ?? [];
        if (!allowed.includes(employee.user.role)) throw new ForbiddenException(`A ${actorRole} cannot increment salary for a ${employee.user.role}.`);
        return this.prisma.employee.update({
            where: { id },
            data: { salary: { increment: amount } },
            include: { user: { select: SAFE_USER_SELECT }, department: { select: { id: true, name: true } } },
        });
    }

    async resetPassword(id: number, newPassword: string, companyId: number, actorRole: string, actorDepartmentId: number | null) {
        if (!newPassword || newPassword.length < 6) throw new BadRequestException('Password must be at least 6 characters.');
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId }, include: { user: { select: { id: true, role: true } } } });
        if (!employee) throw new NotFoundException('Employee not found');
        const allowed = PASSWORD_RESET_RULES[actorRole] ?? [];
        if (!allowed.includes(employee.user.role)) throw new ForbiddenException(`A ${actorRole} cannot reset password for a ${employee.user.role}.`);
        if (actorRole === 'DEPT_MANAGER' && employee.departmentId !== actorDepartmentId) throw new ForbiddenException('You can only reset passwords for employees in your department.');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({ where: { id: employee.userId }, data: { passwordHash: hashedPassword } });
        return { message: 'Password reset successfully.' };
    }

    async deactivate(id: number, companyId: number, actorRole: string, actorDepartmentId: number | null) {
        if (actorRole === 'EMPLOYEE') throw new ForbiddenException('Employees cannot deactivate accounts.');
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');
        if (actorRole === 'DEPT_MANAGER' && employee.departmentId !== actorDepartmentId) throw new ForbiddenException('You can only deactivate employees in your department.');
        await this.prisma.user.update({ where: { id: employee.userId }, data: { isActive: false } });
        return this.prisma.employee.update({ where: { id }, data: { status: 'inactive' } });
    }

    async remove(id: number, companyId: number, actorRole: string) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) throw new ForbiddenException('Only Company Admin or HR can delete employees.');
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');
        await this.prisma.employee.delete({ where: { id } });
        await this.prisma.user.delete({ where: { id: employee.userId } });
        return { message: 'Employee deleted successfully' };
    }
}
