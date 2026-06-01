import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
    constructor(private prisma: PrismaService) { }

    private async getShiftForEmployee(companyId: string, departmentId: string | null) {
        // Try department-specific shift first
        if (departmentId) {
            const deptShift = await this.prisma.shiftSchedule.findFirst({
                where: { companyId, departmentId, isActive: true },
            });
            if (deptShift) return deptShift;
        }
        // Fall back to company-wide shift
        return this.prisma.shiftSchedule.findFirst({
            where: { companyId, departmentId: null, isActive: true },
        });
    }

    private parseTime(timeStr: string, date: Date): Date {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const result = new Date(date);
        result.setHours(hours, minutes, 0, 0);
        return result;
    }

    async checkIn(employeeId: string, companyId: string) {
        const employee = await this.prisma.employee.findFirst({
            where: { id: employeeId, companyId },
        });
        if (!employee) throw new NotFoundException('Employee not found');

        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check if already checked in today
        const existing = await this.prisma.attendance.findFirst({
            where: { employeeId, companyId, date: { gte: today, lt: tomorrow } },
        });
        if (existing) throw new BadRequestException('Already checked in today');

        // Get shift schedule
        const shift = await this.getShiftForEmployee(companyId, employee.departmentId);
        let status = 'present';

        if (shift) {
            const shiftStart = this.parseTime(shift.shiftStart, now);
            const gracePeriodMs = (shift.gracePeriod || 30) * 60 * 1000;
            const tooEarlyTime = new Date(shiftStart.getTime() - 60 * 60 * 1000); // 1 hour before

            if (now < tooEarlyTime) {
                throw new BadRequestException('Too early to check in');
            }
            if (now > new Date(shiftStart.getTime() + gracePeriodMs)) {
                status = 'late';
            }
        }

        return this.prisma.attendance.create({
            data: {
                companyId,
                employeeId,
                date: today,
                checkIn: now,
                status,
            },
            include: {
                employee: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
            },
        });
    }

    async checkOut(employeeId: string, companyId: string) {
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const record = await this.prisma.attendance.findFirst({
            where: { employeeId, companyId, date: { gte: today, lt: tomorrow } },
        });
        if (!record) throw new NotFoundException('No check-in record found for today');
        if (record.checkOut) throw new BadRequestException('Already checked out today');

        return this.prisma.attendance.update({
            where: { id: record.id },
            data: { checkOut: now },
        });
    }

    async manualMark(dto: any, companyId: string, actorRole: string) {
        if (!['COMPANY_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'].includes(actorRole)) {
            throw new ForbiddenException('Not authorized to manually mark attendance');
        }

        return this.prisma.attendance.create({
            data: {
                companyId,
                employeeId: dto.employeeId,
                date: new Date(dto.date),
                checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
                checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
                status: dto.status,
            },
            include: {
                employee: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
            },
        });
    }

    async findAll(companyId: string, actorRole: string, actorDeptId: string | null) {
        const where: any = { companyId };

        if (actorRole === 'DEPT_MANAGER' && actorDeptId) {
            where.employee = { departmentId: actorDeptId };
        }

        return this.prisma.attendance.findMany({
            where,
            include: {
                employee: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
            },
            orderBy: { date: 'desc' },
        });
    }

    async getTodaySummary(companyId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [present, absent, late, totalEmployees] = await Promise.all([
            this.prisma.attendance.count({ where: { companyId, date: { gte: today, lt: tomorrow }, status: 'present' } }),
            this.prisma.attendance.count({ where: { companyId, date: { gte: today, lt: tomorrow }, status: 'absent' } }),
            this.prisma.attendance.count({ where: { companyId, date: { gte: today, lt: tomorrow }, status: 'late' } }),
            this.prisma.employee.count({ where: { companyId, status: 'active' } }),
        ]);

        return { present, absent, late, totalEmployees };
    }

    async findByDate(date: string, companyId: string) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        return this.prisma.attendance.findMany({
            where: { companyId, date: { gte: start, lte: end } },
            include: {
                employee: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
            },
        });
    }

    async findByEmployee(employeeId: string, companyId: string) {
        return this.prisma.attendance.findMany({
            where: { employeeId, companyId },
            orderBy: { date: 'desc' },
        });
    }

    async update(id: string, dto: any, companyId: string) {
        const record = await this.prisma.attendance.findFirst({ where: { id, companyId } });
        if (!record) throw new NotFoundException('Attendance record not found');

        return this.prisma.attendance.update({
            where: { id },
            data: {
                checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
                checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
                status: dto.status,
            },
        });
    }

    async setShift(dto: any, companyId: string, createdById: string) {
        // Deactivate existing shift for same dept (or company-wide)
        await this.prisma.shiftSchedule.updateMany({
            where: { companyId, departmentId: dto.departmentId || null, isActive: true },
            data: { isActive: false },
        });

        return this.prisma.shiftSchedule.create({
            data: {
                companyId,
                departmentId: dto.departmentId || null,
                name: dto.name,
                shiftStart: dto.shiftStart,
                shiftEnd: dto.shiftEnd,
                gracePeriod: dto.gracePeriod || 30,
                isActive: true,
                createdById,
            },
        });
    }

    async getShift(companyId: string, departmentId?: string) {
        return this.prisma.shiftSchedule.findMany({
            where: { companyId, isActive: true, ...(departmentId ? { departmentId } : {}) },
            include: { department: true },
            orderBy: { createdAt: 'desc' },
        });
    }
}
