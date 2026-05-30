import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: string) {
        return this.prisma.attendance.findMany({
            where: { companyId },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
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
            this.prisma.attendance.count({
                where: { companyId, date: { gte: today, lt: tomorrow }, status: 'present' },
            }),
            this.prisma.attendance.count({
                where: { companyId, date: { gte: today, lt: tomorrow }, status: 'absent' },
            }),
            this.prisma.attendance.count({
                where: { companyId, date: { gte: today, lt: tomorrow }, status: 'late' },
            }),
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
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
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

    async create(dto: CreateAttendanceDto, companyId: string) {
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
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });
    }

    async update(id: string, dto: UpdateAttendanceDto, companyId: string) {
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
}
