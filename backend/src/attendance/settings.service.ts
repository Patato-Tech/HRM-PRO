import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    // ✅ Get company settings (working days)
    async getSettings(companyId: string) {
        let settings = await this.prisma.companySettings.findUnique({ where: { companyId } });
        if (!settings) {
            // Create default settings if not exists
            settings = await this.prisma.companySettings.create({
                data: { companyId, workingDays: '1,2,3,4,5', timezone: 'Asia/Karachi' },
            });
        }
        return settings;
    }

    // ✅ Update working days
    async updateSettings(companyId: string, workingDays: string, timezone?: string) {
        return this.prisma.companySettings.upsert({
            where: { companyId },
            update: { workingDays, ...(timezone && { timezone }) },
            create: { companyId, workingDays, timezone: timezone || 'Asia/Karachi' },
        });
    }

    // ✅ Get public holidays
    async getHolidays(companyId: string) {
        return this.prisma.publicHoliday.findMany({
            where: { companyId },
            orderBy: { startDate: 'asc' },
        });
    }

    // ✅ Add public holiday with date range
    async addHoliday(companyId: string, name: string, startDate: string, endDate: string) {
        return this.prisma.publicHoliday.create({
            data: { companyId, name, startDate: new Date(startDate), endDate: new Date(endDate) },
        });
    }

    // ✅ Delete public holiday
    async deleteHoliday(id: string, companyId: string) {
        const holiday = await this.prisma.publicHoliday.findFirst({ where: { id, companyId } });
        if (!holiday) throw new NotFoundException('Holiday not found');
        await this.prisma.publicHoliday.delete({ where: { id } });
        return { message: 'Holiday deleted' };
    }
}
