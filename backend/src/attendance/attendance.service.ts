import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { checkPermission, getScopeFilter, isSelfOperation } from '../auth/rbac.util';

@Injectable()
export class AttendanceService {
    constructor(private prisma: PrismaService) { }

    private async getShiftForEmployee(companyId: number, departmentId: number | null) {
        if (departmentId) {
            const deptShift = await this.prisma.shiftSchedule.findFirst({
                where: { companyId, departmentId, isActive: true },
            });
            if (deptShift) return deptShift;
        }
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

    async checkIn(employeeId: number, companyId: number) {
        const employee = await this.prisma.employee.findFirst({
            where: { id: employeeId, companyId },
        });
        if (!employee) throw new NotFoundException('Employee not found');

        if (employee.departmentId) {
            const department = await this.prisma.department.findUnique({ where: { id: employee.departmentId } });
            if (department && department.status === 'inactive') {
                throw new BadRequestException('Your department is currently inactive.');
            }
        }

        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existing = await this.prisma.attendance.findFirst({
            where: { employeeId, companyId, date: { gte: today, lt: tomorrow } },
        });
        if (existing) throw new BadRequestException('Already checked in today');

        const shift = await this.getShiftForEmployee(companyId, employee.departmentId);
        let status = 'present';

        if (shift) {
            const shiftStart = this.parseTime(shift.shiftStart, now);
            const gracePeriodMs = (shift.gracePeriod || 30) * 60 * 1000;
            const tooEarlyTime = new Date(shiftStart.getTime() - 60 * 60 * 1000);
            if (now < tooEarlyTime) throw new BadRequestException('Too early to check in');
            if (now > new Date(shiftStart.getTime() + gracePeriodMs)) status = 'late';
        }

        return this.prisma.attendance.create({
            data: { companyId, employeeId, date: today, checkIn: now, status },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        customRole: true,
                    },
                },
            },
        });
    }

    async checkOut(employeeId: number, companyId: number) {
        const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId } });
        if (employee?.departmentId) {
            const department = await this.prisma.department.findUnique({ where: { id: employee.departmentId } });
            if (department && department.status === 'inactive') {
                throw new BadRequestException('Your department is currently inactive.');
            }
        }

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

    async findAll(companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        const isPlainEmployee = user.role === 'EMPLOYEE' && !user.customRoleScope;

        // Plain employee — own records only
        if (isPlainEmployee) {
            if (!user.employeeId) return [];
            return this.prisma.attendance.findMany({
                where: { companyId, employeeId: Number(user.employeeId) },
                orderBy: { date: 'desc' },
            });
        }

        if (!isAdmin) checkPermission(user, 'attendance', 'view');

        const scopeFilter = getScopeFilter(user);
        return this.prisma.attendance.findMany({
            where: { companyId, ...scopeFilter },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        customRole: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
        });
    }

    async getTodaySummary(companyId: number, user: any) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const scopeFilter = getScopeFilter(user);
        const empFilter = scopeFilter.employee || {};

        const [present, absent, late, totalEmployees] = await Promise.all([
            this.prisma.attendance.count({ where: { companyId, date: { gte: today, lt: tomorrow }, status: 'present', ...scopeFilter } }),
            this.prisma.attendance.count({ where: { companyId, date: { gte: today, lt: tomorrow }, status: 'absent', ...scopeFilter } }),
            this.prisma.attendance.count({ where: { companyId, date: { gte: today, lt: tomorrow }, status: 'late', ...scopeFilter } }),
            this.prisma.employee.count({ where: { companyId, status: 'active', ...empFilter } }),
        ]);
        return { present, absent, late, totalEmployees };
    }

    async findByDate(date: string, companyId: number, user: any) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const scopeFilter = getScopeFilter(user);

        return this.prisma.attendance.findMany({
            where: { companyId, date: { gte: start, lte: end }, ...scopeFilter },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        customRole: true,
                    },
                },
            },
        });
    }

    async findByEmployee(employeeId: number, companyId: number) {
        return this.prisma.attendance.findMany({
            where: { employeeId, companyId },
            orderBy: { date: 'desc' },
        });
    }

    async update(id: number, dto: any, companyId: number, user: any) {
        if (user.role !== 'COMPANY_ADMIN') {
            checkPermission(user, 'attendance', 'manage');
        }
        const record = await this.prisma.attendance.findFirst({ where: { id, companyId } });
        if (!record) throw new NotFoundException('Attendance record not found');

        // own_department scope — can only edit own dept attendance
        if (user.customRoleScope === 'own_department') {
            const emp = await this.prisma.employee.findFirst({ where: { id: record.employeeId } });
            if (emp?.departmentId !== Number(user.departmentId)) {
                throw new ForbiddenException('You can only edit attendance in your department.');
            }
        }

        return this.prisma.attendance.update({
            where: { id },
            data: {
                checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
                checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
                status: dto.status,
            },
        });
    }

    async setShift(dto: any, companyId: number, createdById: number) {
        const deptId = dto.departmentId ? Number(dto.departmentId) : null;
        await this.prisma.shiftSchedule.updateMany({
            where: { companyId, departmentId: deptId, isActive: true },
            data: { isActive: false },
        });
        return this.prisma.shiftSchedule.create({
            data: {
                companyId,
                departmentId: deptId,
                name: dto.name,
                shiftStart: dto.shiftStart,
                shiftEnd: dto.shiftEnd,
                gracePeriod: dto.gracePeriod || 30,
                isActive: true,
                createdById,
            },
        });
    }

    async getShift(companyId: number, departmentId?: string) {
        const deptId = departmentId ? Number(departmentId) : undefined;
        return this.prisma.shiftSchedule.findMany({
            where: { companyId, isActive: true, ...(deptId ? { departmentId: deptId } : {}) },
            include: { department: true },
            orderBy: { createdAt: 'desc' },
        });
    }
}
