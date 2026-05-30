import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/payroll.dto';

@Injectable()
export class PayrollService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: string) {
        return this.prisma.payroll.findMany({
            where: { companyId },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getSummary(companyId: string) {
        const payrolls = await this.prisma.payroll.findMany({
            where: { companyId },
        });

        const totalPaid = payrolls
            .filter(p => p.status === 'approved')
            .reduce((sum, p) => sum + p.netSalary, 0);

        const totalPending = payrolls
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + p.netSalary, 0);

        return {
            totalPaid,
            totalPending,
            totalRecords: payrolls.length,
        };
    }

    async findByMonth(month: number, year: number, companyId: string) {
        return this.prisma.payroll.findMany({
            where: { companyId, month, year },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });
    }

    async findByEmployee(employeeId: string, companyId: string) {
        return this.prisma.payroll.findMany({
            where: { employeeId, companyId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(dto: CreatePayrollDto, companyId: string) {
        const allowances = dto.allowances || 0;
        const deductions = dto.deductions || 0;
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
                    },
                },
            },
        });
    }

    async update(id: string, dto: UpdatePayrollDto, companyId: string) {
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

    async approve(id: string, companyId: string) {
        const payroll = await this.prisma.payroll.findFirst({ where: { id, companyId } });
        if (!payroll) throw new NotFoundException('Payroll record not found');

        return this.prisma.payroll.update({
            where: { id },
            data: { status: 'approved' },
        });
    }
}
