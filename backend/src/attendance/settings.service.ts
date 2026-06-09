import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    async getSettings(companyId: number) {
        let settings = await this.prisma.companySettings.findUnique({ where: { companyId } });
        if (!settings) {
            settings = await this.prisma.companySettings.create({
                data: { companyId, workingDays: '1,2,3,4,5', timezone: 'Asia/Karachi' },
            });
        }
        return settings;
    }

    async updateSettings(companyId: number, workingDays: string, timezone?: string) {
        return this.prisma.companySettings.upsert({
            where: { companyId },
            update: { workingDays, ...(timezone && { timezone }) },
            create: { companyId, workingDays, timezone: timezone || 'Asia/Karachi' },
        });
    }

    async getHolidays(companyId: number) {
        return this.prisma.publicHoliday.findMany({
            where: { companyId },
            orderBy: { startDate: 'asc' },
        });
    }

    async addHoliday(companyId: number, name: string, startDate: string, endDate: string) {
        return this.prisma.publicHoliday.create({
            data: { companyId, name, startDate: new Date(startDate), endDate: new Date(endDate) },
        });
    }

    async deleteHoliday(id: number, companyId: number) {
        const holiday = await this.prisma.publicHoliday.findFirst({ where: { id, companyId } });
        if (!holiday) throw new NotFoundException('Holiday not found');
        await this.prisma.publicHoliday.delete({ where: { id } });
        return { message: 'Holiday deleted' };
    }
}
