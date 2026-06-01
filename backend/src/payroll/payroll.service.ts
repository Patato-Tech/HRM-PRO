import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/payroll.dto';

// Salary increment rules
const SALARY_INCREMENT_RULES: Record<string, string[]> = {
    COMPANY_ADMIN: ['HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    HR_MANAGER: ['DEPT_MANAGER', 'EMPLOYEE'],
};

@Injectable()
export class PayrollService {
    constructor(private prisma: PrismaService) { }

    // ─────────────────────────────────────────────
    // GET ALL — scoped by role
    // ─────────────────────────────────────────────
    async findAll(companyId: string, actorRole: string, actorUserId: string, actorEmployeeId: string | null) {
        // Employee: own payroll only
        if (actorRole === 'EMPLOYEE') {
            if (!actorEmployeeId) return [];
            return this.prisma.payroll.findMany({
                where: { companyId, employeeId: actorEmployeeId },
                include: {
                    employee: {
                        include: { user: { select: { id: true, name: true, email: true } } },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }

        // Dept Manager: own record only (they can't see others' payroll)
        if (actorRole === 'DEPT_MANAGER') {
            if (!actorEmployeeId) return [];
            return this.prisma.payroll.findMany({
                where: { companyId, employeeId: actorEmployeeId },
                include: {
                    employee: {
                        include: { user: { select: { id: true, name: true, email: true } } },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }

        // Company Admin + HR: full company
        return this.prisma.payroll.findMany({
            where: { companyId },
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

    // ─────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────
    async getSummary(companyId: string, actorRole: string) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) {
            throw new ForbiddenException('Only Company Admin and HR can view payroll summary.');
        }

        const payrolls = await this.prisma.payroll.findMany({ where: { companyId } });

        const totalPaid = payrolls.filter(p => p.status === 'approved').reduce((s, p) => s + p.netSalary, 0);
        const totalPending = payrolls.filter(p => p.status === 'pending').reduce((s, p) => s + p.netSalary, 0);

        return { totalPaid, totalPending, totalRecords: payrolls.length };
    }

    // ─────────────────────────────────────────────
    // BY MONTH
    // ─────────────────────────────────────────────
    async findByMonth(month: number, year: number, companyId: string, actorRole: string, actorEmployeeId: string | null) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) {
            throw new ForbiddenException('Only Company Admin and HR can view monthly payroll.');
        }

        return this.prisma.payroll.findMany({
            where: { companyId, month, year },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        department: { select: { id: true, name: true } },
                    },
                },
            },
        });
    }

    // ─────────────────────────────────────────────
    // BY EMPLOYEE — used for own payslip download
    // ─────────────────────────────────────────────
    async findByEmployee(employeeId: string, companyId: string, actorRole: string, actorEmployeeId: string | null) {
        // Employees and Dept Managers can only fetch their own
        if (['EMPLOYEE', 'DEPT_MANAGER', 'HR_MANAGER'].includes(actorRole)) {
            if (actorEmployeeId !== employeeId) {
                throw new ForbiddenException('You can only view your own payroll records.');
            }
        }

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

    // ─────────────────────────────────────────────
    // CREATE PAYROLL — Company Admin + HR only
    // ─────────────────────────────────────────────
    async create(dto: CreatePayrollDto, companyId: string, actorRole: string) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) {
            throw new ForbiddenException('Only Company Admin and HR can process payroll.');
        }

        // Apply automated deductions if rules exist
        const autoDeductions = await this.calculateAutoDeductions(
            dto.employeeId,
            companyId,
            dto.month,
            dto.year,
            dto.basic,
        );

        const allowances = dto.allowances || 0;
        const deductions = (dto.deductions || 0) + autoDeductions;
        const netSalary = dto.basic + allowances - deductions;

        return this.prisma.payroll.create({
            data: {
                companyId,
                employeeId: dto.employeeId,
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

    // ─────────────────────────────────────────────
    // AUTOMATED DEDUCTION ENGINE
    // Only Company Admin can configure rules (via /payroll/deduction-rules)
    // Rules applied automatically when payroll is created
    // ─────────────────────────────────────────────
    private async calculateAutoDeductions(
        employeeId: string,
        companyId: string,
        month: number,
        year: number,
        basicSalary: number,
    ): Promise<number> {
        // Get deduction rules for this company
        const rules = await this.prisma.deductionRule.findMany({
            where: { companyId, isActive: true },
        });

        if (!rules.length) return 0;

        // Get attendance for this month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const attendance = await this.prisma.attendance.findMany({
            where: { employeeId, companyId, date: { gte: startDate, lte: endDate } },
        });

        // Get unapproved leaves
        const unapprovedLeaves = await this.prisma.leave.findMany({
            where: {
                employeeId,
                companyId,
                status: 'rejected',
                startDate: { gte: startDate },
                endDate: { lte: endDate },
            },
        });

        const lateCount = attendance.filter(a => a.status === 'late').length;
        const halfDayCount = attendance.filter(a => a.status === 'half_day').length;
        const unapprovedLeaveDays = unapprovedLeaves.reduce((s, l) => s + l.days, 0);

        const workingDaysInMonth = 26; // standard working days
        const perDaySalary = basicSalary / workingDaysInMonth;

        let totalDeduction = 0;

        for (const rule of rules) {
            if (rule.type === 'LATE_ARRIVAL' && lateCount > 0) {
                // e.g. deductPercentage = 1 means 1% of daily salary per late arrival
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

    // ─────────────────────────────────────────────
    // CONFIGURE DEDUCTION RULES — Company Admin only
    // ─────────────────────────────────────────────
    async setDeductionRule(
        companyId: string,
        actorRole: string,
        dto: { type: string; deductPercentage: number; isActive: boolean },
    ) {
        if (actorRole !== 'COMPANY_ADMIN') {
            throw new ForbiddenException('Only Company Admin can configure deduction rules.');
        }

        // Upsert — one rule per type per company
        return this.prisma.deductionRule.upsert({
            where: { companyId_type: { companyId, type: dto.type } },
            create: { companyId, type: dto.type, deductPercentage: dto.deductPercentage, isActive: dto.isActive },
            update: { deductPercentage: dto.deductPercentage, isActive: dto.isActive },
        });
    }

    async getDeductionRules(companyId: string, actorRole: string) {
        if (actorRole !== 'COMPANY_ADMIN') {
            throw new ForbiddenException('Only Company Admin can view deduction rules.');
        }
        return this.prisma.deductionRule.findMany({ where: { companyId } });
    }

    // ─────────────────────────────────────────────
    // SALARY INCREMENT
    // Company Admin → HR, Dept Manager, Employee
    // HR Manager    → Dept Manager, Employee only
    // ─────────────────────────────────────────────
    async incrementSalary(
        employeeId: string,
        amount: number,
        companyId: string,
        actorRole: string,
    ) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) {
            throw new ForbiddenException('Only Company Admin and HR can increment salaries.');
        }

        if (amount <= 0) throw new BadRequestException('Increment amount must be positive.');

        const employee = await this.prisma.employee.findFirst({
            where: { id: employeeId, companyId },
            include: { user: { select: { role: true } } },
        });
        if (!employee) throw new NotFoundException('Employee not found.');

        const targetRole = employee.user.role;
        const allowed = SALARY_INCREMENT_RULES[actorRole] ?? [];

        if (!allowed.includes(targetRole)) {
            throw new ForbiddenException(
                `A ${actorRole} cannot increment salary for a ${targetRole}.`,
            );
        }

        return this.prisma.employee.update({
            where: { id: employeeId },
            data: { salary: { increment: amount } },
            include: { user: { select: { id: true, name: true, role: true } } },
        });
    }

    // ─────────────────────────────────────────────
    // UPDATE PAYROLL — Company Admin + HR only
    // ─────────────────────────────────────────────
    async update(id: string, dto: UpdatePayrollDto, companyId: string, actorRole: string) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) {
            throw new ForbiddenException('Only Company Admin and HR can update payroll.');
        }

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

    // ─────────────────────────────────────────────
    // APPROVE — Company Admin + HR only
    // ─────────────────────────────────────────────
    async approve(id: string, companyId: string, actorRole: string) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) {
            throw new ForbiddenException('Only Company Admin and HR can approve payroll.');
        }

        const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
        if (!payroll) throw new NotFoundException('Payroll record not found');

        return this.prisma.payroll.update({
            where: { id },
            data: { status: 'approved' },
        });
    }

    // ─────────────────────────────────────────────
    // GET PAYSLIP DATA — for PDF generation
    // Employee, Dept Manager, HR — own payslip only
    // ─────────────────────────────────────────────
    async getPayslip(
        employeeId: string,
        month: number,
        year: number,
        companyId: string,
        actorRole: string,
        actorEmployeeId: string | null,
    ) {
        // Everyone can only get their own payslip
        if (actorEmployeeId !== employeeId) {
            throw new ForbiddenException('You can only download your own payslip.');
        }

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

        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true },
        });

        return {
            company: company?.name,
            employee: payroll.employee.user.name,
            designation: payroll.employee.designation,
            department: payroll.employee.department?.name,
            role: payroll.employee.user.role,
            month,
            year,
            basic: payroll.basic,
            allowances: payroll.allowances,
            deductions: payroll.deductions,
            netSalary: payroll.netSalary,
            status: payroll.status,
        };
    }
}
