import { Cron } from '@nestjs/schedule';
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
        if (existing && existing.status === 'on_leave') throw new BadRequestException('You are on approved leave today. Check-in is not allowed.');
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

        // Auto-detect half day (less than 4 hours)
        const hoursWorked = (now.getTime() - record.checkIn!.getTime()) / (1000 * 60 * 60);
        const newStatus = hoursWorked < 4 ? 'half_day' : record.status;

        return this.prisma.attendance.update({
            where: { id: record.id },
            data: { checkOut: now, status: newStatus },
        });
    }

    async manualMark(dto: any, companyId: number, user: any) {
        if (user.role !== 'COMPANY_ADMIN') {
            checkPermission(user, 'attendance', 'manage');
        }
        const empId = Number(dto.employeeId);
        const date = new Date(dto.date);
        date.setHours(0, 0, 0, 0);
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existing = await this.prisma.attendance.findFirst({
            where: { employeeId: empId, companyId, date: { gte: date, lt: tomorrow } },
        });

        const data: any = {
            companyId,
            employeeId: empId,
            date,
            status: dto.status || 'present',
            checkIn: dto.checkIn ? new Date(`${dto.date}T${dto.checkIn}`) : null,
            checkOut: dto.checkOut ? new Date(`${dto.date}T${dto.checkOut}`) : null,
        };

        if (existing) {
            return this.prisma.attendance.update({
                where: { id: existing.id },
                data,
                include: { employee: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
            });
        }

        return this.prisma.attendance.create({
            data,
            include: { employee: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
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
        const selfExcludeId = user.employeeId ? Number(user.employeeId) : null;
        const allRecords = await this.prisma.attendance.findMany({
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
            orderBy: { date: 'desc' },
        });
        return selfExcludeId ? allRecords.filter(r => r.employeeId !== selfExcludeId) : allRecords;
    }

    async getTodaySummary(companyId: number, user: any) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        console.log('ATTENDANCE USER:', JSON.stringify(user));
        const scopeFilter = getScopeFilter(user);
        const empFilter = scopeFilter.employee || {};

        const [present, late, halfDay, totalEmployees] = await Promise.all([
            this.prisma.attendance.count({ where: { companyId, date: { gte: today, lt: tomorrow }, status: 'present', ...scopeFilter } }),
            this.prisma.attendance.count({ where: { companyId, date: { gte: today, lt: tomorrow }, status: 'late', ...scopeFilter } }),
            this.prisma.attendance.count({ where: { companyId, date: { gte: today, lt: tomorrow }, status: 'half_day', ...scopeFilter } }),
            this.prisma.employee.count({ where: { companyId, status: 'active', ...empFilter } }),
        ]);
        const onLeave = await this.prisma.attendance.count({ where: { companyId, date: { gte: today, lt: tomorrow }, status: 'on_leave', ...scopeFilter } });
        const absent = totalEmployees - present - late - halfDay - onLeave;
        return { present, absent, late, halfDay, onLeave, totalEmployees };

    }
    async findByDate(date: string, companyId: number, user: any) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const scopeFilter = getScopeFilter(user);
        const selfExcludeId = user.employeeId ? Number(user.employeeId) : null;

        const dateRecords = await this.prisma.attendance.findMany({
            where: { companyId, date: { gte: start, lte: end }, ...scopeFilter },
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

        // Fetch all employees and add absent records for those without attendance
        const allEmployees = await this.prisma.employee.findMany({
            where: { companyId, status: 'active' },
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
                department: { select: { id: true, name: true } },
                customRole: true,
            },
        });

        const markedEmployeeIds = new Set(dateRecords.map(r => r.employeeId));
        const absentRecords = allEmployees
            .filter(emp => !markedEmployeeIds.has(emp.id))
            .filter(emp => !selfExcludeId || emp.id !== selfExcludeId)
            .map(emp => ({
                id: -emp.id,
                companyId,
                employeeId: emp.id,
                date: start,
                checkIn: null,
                checkOut: null,
                status: 'absent',
                createdAt: start,
                employee: emp,
            }));

        const allRecords = [...dateRecords, ...absentRecords];
        return selfExcludeId ? allRecords.filter(r => r.employeeId !== selfExcludeId) : allRecords;
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

    @Cron('59 23 * * *')
    async autoCheckout() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all attendance records with checkIn but no checkOut for today
        const missing = await this.prisma.attendance.findMany({
            where: { date: today, checkIn: { not: null }, checkOut: null },
            include: { employee: { select: { id: true, departmentId: true, companyId: true } } },
        });

        for (const record of missing) {
            const shift = await this.getShiftForEmployee(record.employee.companyId, record.employee.departmentId);
            const checkoutTime = shift
                ? this.parseTime(shift.shiftEnd, new Date())
                : (() => { const d = new Date(); d.setHours(18, 0, 0, 0); return d; })();

            await this.prisma.attendance.update({
                where: { id: record.id },
                data: { checkOut: checkoutTime },
            });
        }
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

