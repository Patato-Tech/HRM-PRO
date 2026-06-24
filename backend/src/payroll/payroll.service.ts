import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { checkPermission, getScopeFilter, isSelfOperation } from '../auth/rbac.util';

@Injectable()
export class PayrollService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        const isPlainEmployee = user.role === 'EMPLOYEE' && !user.customRoleScope;

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

    async create(dto: any, companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        if (!isAdmin) checkPermission(user, 'payroll', 'process');

        const empId = Number(dto.employeeId);
        const basic = Number(dto.basic || 0);
        const houseRent = Number(dto.houseRent || 0);
        const medicalAllowance = Number(dto.medicalAllowance || 0);
        const transportAllowance = Number(dto.transportAllowance || 0);
        const otherAllowances = Number(dto.otherAllowances || 0);
        const bonus = Number(dto.bonus || 0);
        const overtimePay = Number(dto.overtimePay || 0);
        const grossSalary = basic + houseRent + medicalAllowance + transportAllowance + otherAllowances + bonus + overtimePay;

        const withholdingTax = Number(dto.withholdingTax || 0);
        const eobi = Number(dto.eobi !== undefined ? dto.eobi : Math.round(basic * 0.01));
        const loanDeduction = Number(dto.loanDeduction || 0);
        const otherDeductions = Number(dto.otherDeductions || 0);
        const totalDeductions = withholdingTax + eobi + loanDeduction + otherDeductions;
        const netSalary = grossSalary - totalDeductions;

        // Auto deductions from attendance
        const { total: autoDeductions, breakdown } = await this.calculateAutoDeductionsWithBreakdown(empId, companyId, Number(dto.month), Number(dto.year), basic);

        return this.prisma.payroll.create({
            data: {
                companyId,
                employeeId: empId,
                month: Number(dto.month),
                year: Number(dto.year),
                basic,
                houseRent,
                medicalAllowance,
                transportAllowance,
                otherAllowances,
                bonus,
                overtimePay,
                grossSalary,
                withholdingTax,
                eobi,
                loanDeduction,
                otherDeductions: otherDeductions + autoDeductions,
                totalDeductions: totalDeductions + autoDeductions,
                allowances: houseRent + medicalAllowance + transportAllowance + otherAllowances + bonus + overtimePay,
                deductions: totalDeductions + autoDeductions,
                netSalary: netSalary - autoDeductions,
                notes: dto.notes ? dto.notes + (breakdown.length ? ' | AUTO_DEDUCTIONS:' + JSON.stringify(breakdown) : '') : (breakdown.length ? 'AUTO_DEDUCTIONS:' + JSON.stringify(breakdown) : null),
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

    private async calculateAutoDeductionsWithBreakdown(
        employeeId: number, companyId: number, month: number, year: number, basicSalary: number
    ): Promise<{ total: number; breakdown: any[] }> {
        const rules = await this.prisma.deductionRule.findMany({ where: { companyId, isActive: true } });
        if (!rules.length) return { total: 0, breakdown: [] };
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const attendance = await this.prisma.attendance.findMany({ where: { employeeId, companyId, date: { gte: startDate, lte: endDate } } });
        const unapprovedLeaves = await this.prisma.leave.findMany({ where: { employeeId, companyId, status: 'rejected', startDate: { gte: startDate }, endDate: { lte: endDate } } });
        const lateCount = attendance.filter(a => a.status === 'late').length;
        const halfDayCount = attendance.filter(a => a.status === 'half_day').length;
        const unapprovedLeaveDays = unapprovedLeaves.reduce((s, l) => s + l.days, 0);
        const perDaySalary = basicSalary / 26;
        let total = 0;
        const breakdown: any[] = [];
        for (const rule of rules) {
            if (rule.type === 'LATE_ARRIVAL' && lateCount > 0) {
                const amount = Math.round((perDaySalary * (rule.deductPercentage / 100)) * lateCount);
                total += amount; breakdown.push({ type: 'Late Arrival', count: lateCount, amount });
            }
            if (rule.type === 'HALF_DAY' && halfDayCount > 0) {
                const amount = Math.round((perDaySalary * 0.5) * halfDayCount);
                total += amount; breakdown.push({ type: 'Half Day', count: halfDayCount, amount });
            }
            if (rule.type === 'UNAPPROVED_LEAVE' && unapprovedLeaveDays > 0) {
                const amount = Math.round(perDaySalary * unapprovedLeaveDays);
                total += amount; breakdown.push({ type: 'Unapproved Leave', count: unapprovedLeaveDays, amount });
            }
        }
        return { total, breakdown };
    }


    async setDeductionRule(companyId: number, user: any, dto: { type: string; deductPercentage: number; isActive: boolean }) {
        if (user.role !== 'COMPANY_ADMIN') throw new ForbiddenException('Only Company Admin can configure deduction rules.');
        return this.prisma.deductionRule.upsert({
            where: { companyId_type: { companyId, type: dto.type } },
            create: { companyId, type: dto.type, deductPercentage: dto.deductPercentage, isActive: dto.isActive },
            update: { deductPercentage: dto.deductPercentage, isActive: dto.isActive },
        });
    }

    async getDeductionPreview(employeeId: number, month: number, year: number, basic: number, companyId: number) {
        const { total, breakdown } = await this.calculateAutoDeductionsWithBreakdown(employeeId, companyId, month, year, basic);
        return { total, breakdown };
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

    async update(id: number, dto: any, companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        if (!isAdmin) checkPermission(user, 'payroll', 'view');

        const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
        if (!payroll) throw new NotFoundException('Payroll record not found');

        const basic = Number(dto.basic ?? payroll.basic);
        const houseRent = Number(dto.houseRent ?? (payroll as any).houseRent ?? 0);
        const medicalAllowance = Number(dto.medicalAllowance ?? (payroll as any).medicalAllowance ?? 0);
        const transportAllowance = Number(dto.transportAllowance ?? (payroll as any).transportAllowance ?? 0);
        const otherAllowances = Number(dto.otherAllowances ?? (payroll as any).otherAllowances ?? 0);
        const bonus = Number(dto.bonus ?? (payroll as any).bonus ?? 0);
        const overtimePay = Number(dto.overtimePay ?? (payroll as any).overtimePay ?? 0);
        const grossSalary = basic + houseRent + medicalAllowance + transportAllowance + otherAllowances + bonus + overtimePay;

        const withholdingTax = Number(dto.withholdingTax ?? (payroll as any).withholdingTax ?? 0);
        const eobi = Number(dto.eobi ?? (payroll as any).eobi ?? Math.round(basic * 0.01));
        const loanDeduction = Number(dto.loanDeduction ?? (payroll as any).loanDeduction ?? 0);
        const otherDeductions = Number(dto.otherDeductions ?? (payroll as any).otherDeductions ?? 0);
        const totalDeductions = withholdingTax + eobi + loanDeduction + otherDeductions;
        const netSalary = grossSalary - totalDeductions;

        return this.prisma.payroll.update({
            where: { id },
            data: {
                basic, houseRent, medicalAllowance, transportAllowance,
                otherAllowances, bonus, overtimePay, grossSalary,
                withholdingTax, eobi, loanDeduction, otherDeductions,
                totalDeductions, netSalary,
                allowances: houseRent + medicalAllowance + transportAllowance + otherAllowances + bonus + overtimePay,
                deductions: totalDeductions,
                notes: dto.notes ?? (payroll as any).notes,
                status: dto.status ?? payroll.status,
            },
        });
    }

    async approve(id: number, companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        if (!isAdmin) checkPermission(user, 'payroll', 'approve');

        const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
        if (!payroll) throw new NotFoundException('Payroll record not found');
        return this.prisma.payroll.update({ where: { id }, data: { status: 'approved' } });
    }

    async delete(id: number, companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        if (!isAdmin) checkPermission(user, 'payroll', 'process');
        const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
        if (!payroll) throw new NotFoundException('Payroll record not found');
        return this.prisma.payroll.delete({ where: { id } });
    }

    async markPaid(id: number, companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        if (!isAdmin) checkPermission(user, 'payroll', 'approve');

        const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
        if (!payroll) throw new NotFoundException('Payroll record not found');
        if (payroll.status !== 'approved') throw new ForbiddenException('Payroll must be approved before marking as paid');
        return this.prisma.payroll.update({ where: { id }, data: { status: 'paid' } });
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

        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true, address: true, industry: true },
        });

        return {
            company: company?.name,
            companyAddress: company?.address,
            employee: payroll.employee.user.name,
            employeeCode: payroll.employee.employeeCode,
            designation: payroll.employee.designation,
            department: payroll.employee.department?.name,
            month, year,
            basic: payroll.basic,
            houseRent: (payroll as any).houseRent || 0,
            medicalAllowance: (payroll as any).medicalAllowance || 0,
            transportAllowance: (payroll as any).transportAllowance || 0,
            otherAllowances: (payroll as any).otherAllowances || 0,
            bonus: (payroll as any).bonus || 0,
            overtimePay: (payroll as any).overtimePay || 0,
            grossSalary: (payroll as any).grossSalary || payroll.basic + payroll.allowances,
            withholdingTax: (payroll as any).withholdingTax || 0,
            eobi: (payroll as any).eobi || 0,
            loanDeduction: (payroll as any).loanDeduction || 0,
            otherDeductions: (payroll as any).otherDeductions || 0,
            totalDeductions: (payroll as any).totalDeductions || payroll.deductions,
            netSalary: payroll.netSalary,
            notes: (payroll as any).notes || null,
            status: payroll.status,
        };
    }
}