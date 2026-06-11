import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/payroll.dto';

const SALARY_INCREMENT_RULES: Record<string, string[]> = {
    COMPANY_ADMIN: ['HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    HR_MANAGER: ['DEPT_MANAGER', 'EMPLOYEE'],
};

@Injectable()
export class PayrollService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: number, actorRole: string, actorUserId: number, actorEmployeeId: number | null) {
        if (actorRole === 'EMPLOYEE' || actorRole === 'DEPT_MANAGER') {
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

    async getSummary(companyId: number, actorRole: string, permissions?: any) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole) && !permissions?.payroll?.view) {
            throw new ForbiddenException('Only Company Admin and HR can view payroll summary.');
        }
        const payrolls = await this.prisma.payroll.findMany({ where: { companyId } });
        const totalPaid = payrolls.filter(p => p.status === 'approved').reduce((s, p) => s + p.netSalary, 0);
        const totalPending = payrolls.filter(p => p.status === 'pending').reduce((s, p) => s + p.netSalary, 0);
        return { totalPaid, totalPending, totalRecords: payrolls.length };
    }

    async findByMonth(month: number, year: number, companyId: number, actorRole: string, actorEmployeeId: number | null) {
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

    async findByEmployee(employeeId: number, companyId: number, actorRole: string, actorEmployeeId: number | null) {
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

    async create(dto: CreatePayrollDto, companyId: number, actorRole: string) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) {
            throw new ForbiddenException('Only Company Admin and HR can process payroll.');
        }

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

    async setDeductionRule(companyId: number, actorRole: string, dto: { type: string; deductPercentage: number; isActive: boolean }) {
        if (actorRole !== 'COMPANY_ADMIN') {
            throw new ForbiddenException('Only Company Admin can configure deduction rules.');
        }
        return this.prisma.deductionRule.upsert({
            where: { companyId_type: { companyId, type: dto.type } },
            create: { companyId, type: dto.type, deductPercentage: dto.deductPercentage, isActive: dto.isActive },
            update: { deductPercentage: dto.deductPercentage, isActive: dto.isActive },
        });
    }

    async getDeductionRules(companyId: number, actorRole: string) {
        if (actorRole !== 'COMPANY_ADMIN') {
            throw new ForbiddenException('Only Company Admin can view deduction rules.');
        }
        return this.prisma.deductionRule.findMany({ where: { companyId } });
    }

    async incrementSalary(employeeId: number, amount: number, companyId: number, actorRole: string) {
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
            throw new ForbiddenException(`A ${actorRole} cannot increment salary for a ${targetRole}.`);
        }

        return this.prisma.employee.update({
            where: { id: employeeId },
            data: { salary: { increment: amount } },
            include: { user: { select: { id: true, name: true, role: true } } },
        });
    }

    async update(id: number, dto: UpdatePayrollDto, companyId: number, actorRole: string) {
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

    async approve(id: number, companyId: number, actorRole: string) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER'].includes(actorRole)) {
            throw new ForbiddenException('Only Company Admin and HR can approve payroll.');
        }
        const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
        if (!payroll) throw new NotFoundException('Payroll record not found');
        return this.prisma.payroll.update({ where: { id }, data: { status: 'approved' } });
    }

    async getPayslip(employeeId: number, month: number, year: number, companyId: number, actorRole: string, actorEmployeeId: number | null) {
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

        const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });

        return {
            company: company?.name,
            employee: payroll.employee.user.name,
            designation: payroll.employee.designation,
            department: payroll.employee.department?.name,
            role: payroll.employee.user.role,
            month, year,
            basic: payroll.basic,
            allowances: payroll.allowances,
            deductions: payroll.deductions,
            netSalary: payroll.netSalary,
            status: payroll.status,
        };
    }
}