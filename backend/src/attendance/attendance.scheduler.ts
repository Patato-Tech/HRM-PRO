import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceScheduler {
    private readonly logger = new Logger(AttendanceScheduler.name);

    constructor(private prisma: PrismaService) { }

    @Cron('59 23 * * *') // Run at 11:59 PM every day
    async autoCheckout() {
        this.logger.log('Running auto-checkout for employees who forgot to check out...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find all check-ins without checkout for today
        const missingCheckouts = await this.prisma.attendance.findMany({
            where: {
                date: { gte: today, lt: tomorrow },
                checkIn: { not: null },
                checkOut: null,
                status: { in: ['present', 'late'] },
            },
            include: {
                employee: true,
            },
        });

        this.logger.log(`Found ${missingCheckouts.length} employees without checkout`);

        for (const record of missingCheckouts) {
            // Get shift for employee
            const shift = await this.prisma.shiftSchedule.findFirst({
                where: {
                    companyId: record.companyId,
                    isActive: true,
                    OR: [
                        { departmentId: record.employee.departmentId },
                        { departmentId: null },
                    ],
                },
                orderBy: { departmentId: 'desc' },
            });

            // Auto checkout at shift end or 6 PM default
            const checkoutTime = new Date();
            if (shift) {
                const [hours, minutes] = shift.shiftEnd.split(':').map(Number);
                checkoutTime.setHours(hours, minutes, 0, 0);
            } else {
                checkoutTime.setHours(18, 0, 0, 0); // Default 6 PM
            }

            // Calculate hours worked
            const hoursWorked = (checkoutTime.getTime() - record.checkIn!.getTime()) / (1000 * 60 * 60);
            const newStatus = hoursWorked < 4 ? 'half_day' : record.status;

            await this.prisma.attendance.update({
                where: { id: record.id },
                data: {
                    checkOut: checkoutTime,
                    status: newStatus,
                },
            });

            this.logger.log(`Auto checkout for employee ${record.employeeId} at ${checkoutTime}`);
        }
    }
}
