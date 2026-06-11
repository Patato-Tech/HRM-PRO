import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/payroll.dto';
import { checkPermission, getScopeFilter, isSelfOperation } from '../auth/rbac.util';

@Injectable()
export class PayrollService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        const isPlainEmployee = user.role === 'EMPLOYEE' && !user.customRoleScope;

        // Plain employee — own payslips only
        if (isPlainEmployee) {
            if (!user.employeeId) return [];
            return this.prisma.payroll.findMany({
                where: { companyId, employeeId: Number(user.employeeId) },
                include: {
                    employee: {
                        include: { user: { select: { id: true, name: true, email: true } } },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }

        if (!isAdmin) checkPermission(user, 'payroll', 'view');

        const scopeFilter = getScopeFilter(user);

        return this.prisma.payroll.findMany({
            where: { companyId, ...scopeFilter },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        department: { select: { id: true, name: true } },
                        customRole: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getSummary(companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        if (!isAdmin) checkPermission(user, 'payroll', 'view');

        const scopeFilter = getScopeFilter(user);
        const payrolls = await this.prisma.payroll.findMany({
            where: { companyId, ...scopeFilter },
        });

        const totalPaid = payrolls.filter(p => p.status === 'approved').reduce((s, p) => s + p.netSalary, 0);
        const totalPending = payrolls.filter(p => p.status === 'pending').reduce((s, p) => s + p.netSalary, 0);
        return { totalPaid, totalPending, totalRecords: payrolls.length };
    }

    async findByMonth(month: number, year: number, companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        if (!isAdmin) checkPermission(user, 'payroll', 'view');

        const scopeFilter = getScopeFilter(user);

        return this.prisma.payroll.findMany({
            where: { companyId, month, year, ...scopeFilter },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        department: { select: { id: true, name: true } },
                        customRole: true,
                    },
                },
            },
        });
    }

    async findByEmployee(employeeId: number, companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        const isPlainEmployee = user.role === 'EMPLOYEE' && !user.customRoleScope;

        // Plain employee can only view own records
        if (isPlainEmployee && Number(user.employeeId) !== employeeId) {
            throw new ForbiddenException('You can only view your own payroll records.');
        }

        if (!isAdmin && !isPlainEmployee) checkPermission(user, 'payroll', 'view');

        return this.prisma.payroll.findMany({
            where: { employeeId, companyId },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        department: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(dto: CreatePayrollDto, companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        if (!isAdmin) checkPermission(user, 'payroll', 'process');

        const empId = Number(dto.employeeId);
        const autoDeductions = await this.calculateAutoDeductions(empId, companyId, dto.month, dto.year, dto.basic);
        const allowances = dto.allowances || 0;
        const deductions = (dto.deductions || 0) + autoDeductions;
        const netSalary = dto.basic + allowances - deductions;

        return this.prisma.payroll.create({
            data: {
                companyId,
                employeeId: empId,
                month: dto.month,
                year: dto.year,
                basic: dto.basic,
                allowances,
                deductions,
                netSalary,
                status: 'pending',
            },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        department: { select: { id: true, name: true } },
                    },
                },
            },
        });
    }

    private async calculateAutoDeductions(
        employeeId: number,
        companyId: number,
        month: number,
        year: number,
        basicSalary: number,
    ): Promise<number> {
        const rules = await this.prisma.deductionRule.findMany({ where: { companyId, isActive: true } });
        if (!rules.length) return 0;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const attendance = await this.prisma.attendance.findMany({
            where: { employeeId, companyId, date: { gte: startDate, lte: endDate } },
        });

        const unapprovedLeaves = await this.prisma.leave.findMany({
            where: { employeeId, companyId, status: 'rejected', startDate: { gte: startDate }, endDate: { lte: endDate } },
        });

        const lateCount = attendance.filter(a => a.status === 'late').length;
        const halfDayCount = attendance.filter(a => a.status === 'half_day').length;
        const unapprovedLeaveDays = unapprovedLeaves.reduce((s, l) => s + l.days, 0);

        const workingDaysInMonth = 26;
        const perDaySalary = basicSalary / workingDaysInMonth;
        let totalDeduction = 0;

        for (const rule of rules) {
            if (rule.type === 'LATE_ARRIVAL' && lateCount > 0) {
                totalDeduction += (perDaySalary * (rule.deductPercentage / 100)) * lateCount;
            }
            if (rule.type === 'HALF_DAY' && halfDayCount > 0) {
                totalDeduction += (perDaySalary * 0.5) * halfDayCount;
            }
            if (rule.type === 'UNAPPROVED_LEAVE' && unapprovedLeaveDays > 0) {
                totalDeduction += perDaySalary * unapprovedLeaveDays;
            }
        }

        return Math.round(totalDeduction);
    }

    async setDeductionRule(companyId: number, user: any, dto: { type: string; deductPercentage: number; isActive: boolean }) {
        if (user.role !== 'COMPANY_ADMIN') throw new ForbiddenException('Only Company Admin can configure deduction rules.');
        return this.prisma.deductionRule.upsert({
            where: { companyId_type: { companyId, type: dto.type } },
            create: { companyId, type: dto.type, deductPercentage: dto.deductPercentage, isActive: dto.isActive },
            update: { deductPercentage: dto.deductPercentage, isActive: dto.isActive },
        });
    }

    async getDeductionRules(companyId: number, user: any) {
        if (user.role !== 'COMPANY_ADMIN') throw new ForbiddenException('Only Company Admin can view deduction rules.');
        return this.prisma.deductionRule.findMany({ where: { companyId } });
    }

    async incrementSalary(employeeId: number, amount: number, companyId: number, user: any) {
        if (user.role !== 'COMPANY_ADMIN') checkPermission(user, 'employees', 'edit_salary');
        if (isSelfOperation(user, employeeId)) throw new ForbiddenException('You cannot modify your own salary.');
        if (amount <= 0) throw new BadRequestException('Increment amount must be positive.');

        const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId } });
        if (!employee) throw new NotFoundException('Employee not found.');

        return this.prisma.employee.update({
            where: { id: employeeId },
            data: { salary: { increment: amount } },
            include: { user: { select: { id: true, name: true, role: true } } },
        });
    }

    async update(id: number, dto: UpdatePayrollDto, companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        if (!isAdmin) checkPermission(user, 'payroll', 'view');

        const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
        if (!payroll) throw new NotFoundException('Payroll record not found');

        const basic = dto.basic ?? payroll.basic;
        const allowances = dto.allowances ?? payroll.allowances;
        const deductions = dto.deductions ?? payroll.deductions;
        const netSalary = basic + allowances - deductions;

        return this.prisma.payroll.update({
            where: { id },
            data: { basic, allowances, deductions, netSalary, status: dto.status },
        });
    }

    async approve(id: number, companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        if (!isAdmin) checkPermission(user, 'payroll', 'approve');

        const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
        if (!payroll) throw new NotFoundException('Payroll record not found');
        return this.prisma.payroll.update({ where: { id }, data: { status: 'approved' } });
    }

    async getPayslip(employeeId: number, month: number, year: number, companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        const isOwn = Number(user.employeeId) === employeeId;

        if (!isAdmin && !isOwn) throw new ForbiddenException('You can only download your own payslip.');

        const payroll = await this.prisma.payroll.findFirst({
            where: { employeeId, companyId, month, year },
            include: {
                employee: {
                    include: {
                        user: { select: { name: true, email: true, role: true } },
                        department: { select: { name: true } },
                    },
                },
            },
        });
        if (!payroll) throw new NotFoundException('Payslip not found for this period.');

        const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });

        return {
            company: company?.name,
            employee: payroll.employee.user.name,
            designation: payroll.employee.designation,
            department: payroll.employee.department?.name,
            month, year,
            basic: payroll.basic,
            allowances: payroll.allowances,
            deductions: payroll.deductions,
            netSalary: payroll.netSalary,
            status: payroll.status,
        };
    }
}
