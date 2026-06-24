import { App } from 'supertest/types';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import * as bcrypt from 'bcryptjs';
import { checkPermission, getEmployeeScopeFilter, canViewSalary, isSelfOperation } from '../auth/rbac.util';

const SAFE_USER_SELECT = { id: true, name: true, email: true, role: true, isActive: true };

@Injectable()
export class EmployeesService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        const isPlainEmployee = user.role === 'EMPLOYEE' && !user.customRoleScope;

        // Plain employee — own record only
        if (isPlainEmployee) {
            const emp = await this.prisma.employee.findFirst({
                where: { companyId, userId: user.userId },
                include: {
                    user: { select: { id: true, name: true, email: true, isActive: true } },
                    department: { select: { id: true, name: true } },
                    customRole: true,
                },
            });
            return emp ? [emp] : [];
        }

        // Check view permission for custom roles
        if (!isAdmin) {
            checkPermission(user, 'employees', 'view');
        }

        // Get scope filter
        const scopeFilter = getEmployeeScopeFilter(user);
        const showSalary = canViewSalary(user);

        // Exclude own record for custom roles
        const selfExclude = user.employeeId ? { id: { not: Number(user.employeeId) } } : {};
        const employees = await this.prisma.employee.findMany({
            where: { companyId, ...scopeFilter, ...selfExclude },
            include: {
                user: { select: SAFE_USER_SELECT },
                department: { select: { id: true, name: true } },
                customRole: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Hide salary from roles without salary permission
        if (!showSalary) {
            return employees.map(({ salary, ...rest }) => rest);
        }

        return employees;
    }

    async getStats(companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        const where: any = { companyId };

        if (!isAdmin) {
            const scopeFilter = getEmployeeScopeFilter(user);
            if (scopeFilter.departmentId) where.departmentId = scopeFilter.departmentId;
        }

        const [total, active, inactive, withRoles] = await Promise.all([
            this.prisma.employee.count({ where }),
            this.prisma.employee.count({ where: { ...where, status: 'active' } }),
            this.prisma.employee.count({ where: { ...where, status: 'inactive' } }),
            this.prisma.employee.count({ where: { ...where, roleId: { not: null } } }),
        ]);

        return { total, active, inactive, withRoles, withoutRoles: total - withRoles };
    }

    async findOne(id: number, companyId: number, user: any) {
        const employee = await this.prisma.employee.findFirst({
            where: { id, companyId },
            include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },
        });
        if (!employee) throw new NotFoundException('Employee not found');

        // Plain employee can only view own profile
        if (user.role === 'EMPLOYEE' && !user.customRoleScope) {
            if (employee.userId !== user.userId) throw new ForbiddenException('You can only view your own profile.');
        }

        // own_department scope — only own department
        if (user.customRoleScope === 'own_department' && employee.departmentId !== user.departmentId) {
            throw new ForbiddenException('You can only view employees in your department.');
        }

        // Show salary when viewing own profile
        const isOwnProfile = Number(user.employeeId) === id;
        if (!canViewSalary(user) && user.role !== 'COMPANY_ADMIN' && !isOwnProfile) {
            const { salary, ...rest } = employee as any;
            return rest;
        }

        return employee;
    }

    async create(dto: CreateEmployeeDto, companyId: number, user: any) {
        if (user.role !== 'COMPANY_ADMIN') {
            checkPermission(user, 'employees', 'create');
        }

        // own_department scope can only add to own department
        if (user.customRoleScope === 'own_department') {
            const deptId = dto.departmentId ? Number(dto.departmentId) : null;
            if (!deptId || deptId !== Number(user.departmentId)) {
                throw new ForbiddenException('You can only add employees to your own department.');
            }
        }

        const salary = user.role !== 'COMPANY_ADMIN' && !user.permissions?.employees?.edit_salary
            ? 0
            : (dto.salary || 0);

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const count = await this.prisma.employee.count({ where: { companyId } });
        const employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;

        const newUser = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash: hashedPassword,
                role: 'EMPLOYEE',
                companyId,
            },
        });

        const deptId = dto.departmentId ? Number(dto.departmentId) : null;
        const roleId = dto.roleId ? Number(dto.roleId) : null;

        return this.prisma.employee.create({
            data: { companyId, userId: newUser.id, employeeCode, designation: dto.designation, departmentId: deptId, salary, roleId },
            include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },
        });
    }

    async update(id: number, dto: UpdateEmployeeDto, companyId: number, user: any) {
        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');

        // Self-modification prevention
        if (isSelfOperation(user, id)) {
            throw new ForbiddenException('You cannot modify your own record. Use the Profile page.');
        }

        const isAdmin = user.role === 'COMPANY_ADMIN';

        if (!isAdmin) {
            checkPermission(user, 'employees', 'edit_basic');

            // own_department scope check
            if (user.customRoleScope === 'own_department' && employee.departmentId !== Number(user.departmentId)) {
                throw new ForbiddenException('You can only edit employees in your department.');
            }
        }

        // Update name (basic edit)
        if (dto.name) {
            await this.prisma.user.update({ where: { id: employee.userId }, data: { name: dto.name } });
        }

        // Full edit fields — only admin or edit_full permission
        const canEditFull = isAdmin || user.permissions?.employees?.edit_full === true;
        const canEditSalary = isAdmin || user.permissions?.employees?.edit_salary === true;

        const deptId = dto.departmentId ? Number(dto.departmentId) : undefined;
        const updateRoleId = dto.roleId !== undefined ? (dto.roleId ? Number(dto.roleId) : null) : undefined;

        return this.prisma.employee.update({
            where: { id },
            data: {
                designation: canEditFull ? dto.designation : undefined,
                departmentId: canEditFull ? (deptId !== undefined ? deptId : null) : undefined,
                salary: canEditSalary ? dto.salary : undefined,
                status: canEditFull ? dto.status : undefined,
                roleId: isAdmin ? updateRoleId : undefined,
            },
            include: { user: { select: SAFE_USER_SELECT }, department: true, customRole: true },
        });
    }

    async incrementSalary(id: number, amount: number, companyId: number, user: any, reason?: string) {
        if (user.role !== 'COMPANY_ADMIN') {
            checkPermission(user, 'employees', 'edit_salary');
        }
        if (isSelfOperation(user, id)) throw new ForbiddenException('You cannot modify your own salary.');
        if (!amount) throw new BadRequestException('Increment amount is required.');

        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');

        const oldSalary = employee.salary;
        const newSalary = oldSalary + amount;
        if (newSalary < 0) throw new BadRequestException('Salary cannot be negative.');

        const updated = await this.prisma.employee.update({
            where: { id },
            data: { salary: newSalary },
            include: { user: { select: SAFE_USER_SELECT }, department: true },
        });

        await this.prisma.salaryHistory.create({
            data: {
                companyId,
                employeeId: id,
                oldSalary,
                newSalary,
                amount: Math.abs(amount),
                type: amount > 0 ? 'increment' : 'decrement',
                reason: reason || null,
                changedById: Number(user.userId),
            },
        });

        return updated;
    }

    async getSalaryHistory(employeeId: number, companyId: number) {
        return this.prisma.salaryHistory.findMany({
            where: { employeeId, companyId },
            include: {
                changedBy: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async resetPassword(id: number, newPassword: string, companyId: number, user: any) {
        if (!newPassword || newPassword.length < 6) throw new BadRequestException('Password must be at least 6 characters.');
        if (isSelfOperation(user, id)) throw new ForbiddenException('You cannot reset your own password from here. Use the Profile page.');

        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');

        if (user.role !== 'COMPANY_ADMIN') {
            checkPermission(user, 'employees', 'edit_basic');
            if (user.customRoleScope === 'own_department' && employee.departmentId !== Number(user.departmentId)) {
                throw new ForbiddenException('You can only reset passwords for employees in your department.');
            }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({ where: { id: employee.userId }, data: { passwordHash: hashedPassword } });
        return { message: 'Password reset successfully.' };
    }

    async deactivate(id: number, companyId: number, user: any) {
        if (isSelfOperation(user, id)) throw new ForbiddenException('You cannot deactivate your own account.');

        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');

        if (user.role !== 'COMPANY_ADMIN') {
            checkPermission(user, 'employees', 'edit_basic');
            if (user.customRoleScope === 'own_department' && employee.departmentId !== Number(user.departmentId)) {
                throw new ForbiddenException('You can only deactivate employees in your department.');
            }
        }

        await this.prisma.user.update({ where: { id: employee.userId }, data: { isActive: false } });
        return this.prisma.employee.update({ where: { id }, data: { status: 'inactive' } });
    }

    async remove(id: number, companyId: number, user: any) {
        if (isSelfOperation(user, id)) throw new ForbiddenException('You cannot delete your own account.');

        const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
        if (!employee) throw new NotFoundException('Employee not found');

        if (user.role !== 'COMPANY_ADMIN') {
            checkPermission(user, 'employees', 'delete');
            if (user.customRoleScope === 'own_department' && employee.departmentId !== Number(user.departmentId)) {
                throw new ForbiddenException('You can only delete employees in your department.');
            }
        }

        await this.prisma.attendance.deleteMany({ where: { employeeId: id } });
        await this.prisma.leave.deleteMany({ where: { employeeId: id } });
        await this.prisma.leaveBalance.deleteMany({ where: { employeeId: id } });
        await this.prisma.payroll.deleteMany({ where: { employeeId: id } });
        await this.prisma.employee.delete({ where: { id } });
        await this.prisma.user.delete({ where: { id: employee.userId } });
        return { message: 'Employee deleted successfully' };
    }
}
