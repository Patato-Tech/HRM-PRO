import { EmailService } from '../email/email.service';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto, CreateLeaveBalanceDto } from './dto/leave.dto';

@Injectable()
export class LeavesService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: number, actorDeptId?: number | null, customRoleScope?: string | null) {
        const where: any = { companyId };
        if (customRoleScope === 'own_department' && actorDeptId) where.employee = { departmentId: actorDeptId };
        return this.prisma.leave.findMany({
            where,
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        department: { select: { name: true } },
                        customRole: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findPending(companyId: number, actorDeptId?: number | null, customRoleScope?: string | null) {
        const where: any = { companyId, status: 'pending' };
        if (customRoleScope === 'own_department' && actorDeptId) where.employee = { departmentId: actorDeptId };
        return this.prisma.leave.findMany({
            where,
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        department: { select: { name: true } },
                        customRole: true,
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
        // Check for overlapping leaves
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        const overlapping = await this.prisma.leave.findFirst({
            where: {
                employeeId: empId,
                companyId,
                status: { in: ['pending', 'approved'] },
                OR: [
                    { startDate: { lte: endDate }, endDate: { gte: startDate } },
                ],
            },
        });
        if (overlapping) {
            throw new BadRequestException(`You already have a leave from ${overlapping.startDate.toDateString()} to ${overlapping.endDate.toDateString()}. Please choose different dates.`);
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
        // Auto-mark attendance as "on_leave" for each leave day
        const leaveDays: Date[] = [];
        const current = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        while (current <= end) {
            leaveDays.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        for (const day of leaveDays) {
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);

            const existing = await this.prisma.attendance.findFirst({
                where: { employeeId: leave.employeeId, companyId, date: { gte: dayStart, lte: dayEnd } },
            });

            if (!existing) {
                await this.prisma.attendance.create({
                    data: {
                        companyId,
                        employeeId: leave.employeeId,
                        date: dayStart,
                        status: 'on_leave',
                        checkIn: null,
                        checkOut: null,
                    },
                });
            } else {
                await this.prisma.attendance.update({
                    where: { id: existing.id },
                    data: { status: 'on_leave' },
                });
            }
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

    async cancel(id: number, companyId: number, employeeId: number) {
        const leave = await this.prisma.leave.findFirst({ where: { id, companyId } });
        if (!leave) throw new NotFoundException('Leave not found');
        if (leave.employeeId !== employeeId) throw new ForbiddenException('You can only cancel your own leave.');
        if (leave.status !== 'pending') throw new BadRequestException('Only pending leaves can be cancelled.');
        return this.prisma.leave.update({ where: { id }, data: { status: 'cancelled' } });
    }

    async remove(id: number, companyId: number, user: any) {
        if (user.role !== 'COMPANY_ADMIN') throw new ForbiddenException('Only Company Admin can delete leave records.');
        const leave = await this.prisma.leave.findFirst({ where: { id, companyId } });
        if (!leave) throw new NotFoundException('Leave not found');
        return this.prisma.leave.delete({ where: { id } });
    }

    async createBalance(dto: CreateLeaveBalanceDto, companyId: number) {
        const existing = await this.prisma.leaveBalance.findFirst({
            where: {
                companyId,
                employeeId: Number(dto.employeeId),
                leaveType: dto.leaveType,
                year: dto.year,
            },
        });
        if (existing) {
            return this.prisma.leaveBalance.update({
                where: { id: existing.id },
                data: {
                    total: dto.total,
                    remaining: dto.total - existing.used,
                },
            });
        }
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

