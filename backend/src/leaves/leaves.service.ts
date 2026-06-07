import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto, CreateLeaveBalanceDto } from './dto/leave.dto';

@Injectable()
export class LeavesService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: number) {
        return this.prisma.leave.findMany({
            where: { companyId },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        department: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findPending(companyId: number) {
        return this.prisma.leave.findMany({
            where: { companyId, status: 'pending' },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        department: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByEmployee(employeeId: number, companyId: number) {
        return this.prisma.leave.findMany({
            where: { employeeId, companyId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getBalance(employeeId: number, companyId: number) {
        return this.prisma.leaveBalance.findMany({
            where: { employeeId, companyId },
        });
    }

    async create(dto: CreateLeaveDto, companyId: number) {
        const empId = Number(dto.employeeId);
        const employee = await this.prisma.employee.findFirst({
            where: { id: empId, companyId },
        });
        if (employee?.departmentId) {
            const department = await this.prisma.department.findUnique({ where: { id: employee.departmentId } });
            if (department && department.status === 'inactive') {
                throw new BadRequestException('Your department is currently inactive. Please contact your administrator.');
            }
        }

        return this.prisma.leave.create({
            data: {
                companyId,
                employeeId: empId,
                leaveType: dto.leaveType,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                days: dto.days,
                reason: dto.reason,
                status: 'pending',
            },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        department: { select: { name: true } },
                    },
                },
            },
        });
    }

    async approve(id: number, companyId: number, approvedBy: number) {
        const leave = await this.prisma.leave.findFirst({ where: { id, companyId } });
        if (!leave) throw new NotFoundException('Leave not found');

        const updated = await this.prisma.leave.update({
            where: { id },
            data: { status: 'approved', approvedBy },
        });

        const balance = await this.prisma.leaveBalance.findFirst({
            where: {
                employeeId: leave.employeeId,
                companyId,
                leaveType: leave.leaveType,
                year: new Date(leave.startDate).getFullYear(),
            },
        });

        if (balance) {
            await this.prisma.leaveBalance.update({
                where: { id: balance.id },
                data: {
                    used: balance.used + leave.days,
                    remaining: balance.remaining - leave.days,
                },
            });
        }

        return updated;
    }

    async reject(id: number, companyId: number) {
        const leave = await this.prisma.leave.findFirst({ where: { id, companyId } });
        if (!leave) throw new NotFoundException('Leave not found');
        return this.prisma.leave.update({
            where: { id },
            data: { status: 'rejected' },
        });
    }

    async createBalance(dto: CreateLeaveBalanceDto, companyId: number) {
        return this.prisma.leaveBalance.create({
            data: {
                companyId,
                employeeId: Number(dto.employeeId),
                leaveType: dto.leaveType,
                total: dto.total,
                used: 0,
                remaining: dto.total,
                year: dto.year,
            },
        });
    }
}
