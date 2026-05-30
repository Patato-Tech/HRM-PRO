import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto, CreateLeaveBalanceDto } from './dto/leave.dto';

@Injectable()
export class LeavesService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: string) {
        return this.prisma.leave.findMany({
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

    async findPending(companyId: string) {
        return this.prisma.leave.findMany({
            where: { companyId, status: 'pending' },
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

    async findByEmployee(employeeId: string, companyId: string) {
        return this.prisma.leave.findMany({
            where: { employeeId, companyId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getBalance(employeeId: string, companyId: string) {
        return this.prisma.leaveBalance.findMany({
            where: { employeeId, companyId },
        });
    }

    async create(dto: CreateLeaveDto, companyId: string) {
        return this.prisma.leave.create({
            data: {
                companyId,
                employeeId: dto.employeeId,
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
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });
    }

    async approve(id: string, companyId: string, approvedBy: string) {
        const leave = await this.prisma.leave.findFirst({ where: { id, companyId } });
        if (!leave) throw new NotFoundException('Leave not found');

        const updated = await this.prisma.leave.update({
            where: { id },
            data: { status: 'approved', approvedBy },
        });

        // Update leave balance
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

    async reject(id: string, companyId: string) {
        const leave = await this.prisma.leave.findFirst({ where: { id, companyId } });
        if (!leave) throw new NotFoundException('Leave not found');

        return this.prisma.leave.update({
            where: { id },
            data: { status: 'rejected' },
        });
    }

    async createBalance(dto: CreateLeaveBalanceDto, companyId: string) {
        return this.prisma.leaveBalance.create({
            data: {
                companyId,
                employeeId: dto.employeeId,
                leaveType: dto.leaveType,
                total: dto.total,
                used: 0,
                remaining: dto.total,
                year: dto.year,
            },
        });
    }
}
