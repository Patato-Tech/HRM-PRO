import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PerformanceService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: number, user: any) {
        const where: any = { companyId };
        if (user.customRoleScope === 'own_department' && user.departmentId) {
            where.employee = { departmentId: Number(user.departmentId) };
        }
        return this.prisma.performanceReview.findMany({
            where,
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        department: { select: { id: true, name: true } },
                        customRole: true,
                    },
                },
                reviewer: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(dto: any, companyId: number, user: any) {
        const kpis = dto.kpis || [];
        const overallRating = kpis.length > 0
            ? kpis.reduce((sum: number, k: any) => sum + Number(k.rating), 0) / kpis.length
            : 0;

        return this.prisma.performanceReview.create({
            data: {
                companyId,
                employeeId: Number(dto.employeeId),
                reviewerId: Number(user.userId),
                period: dto.period,
                reviewDate: new Date(dto.reviewDate),
                kpis: dto.kpis,
                overallRating,
                comments: dto.comments,
                status: 'draft',
            },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true } },
                        department: { select: { name: true } },
                    },
                },
            },
        });
    }

    async update(id: number, dto: any, companyId: number) {
        const review = await this.prisma.performanceReview.findFirst({ where: { id, companyId } });
        if (!review) throw new NotFoundException('Review not found');

        const kpis = dto.kpis || review.kpis;
        const kpisArray = Array.isArray(kpis) ? kpis : [];
        const overallRating = kpisArray.length > 0
            ? kpisArray.reduce((sum: number, k: any) => sum + Number(k.rating), 0) / kpisArray.length
            : review.overallRating;

        return this.prisma.performanceReview.update({
            where: { id },
            data: {
                period: dto.period ?? review.period,
                reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : review.reviewDate,
                kpis: dto.kpis ?? review.kpis,
                overallRating,
                comments: dto.comments ?? review.comments,
                status: dto.status ?? review.status,
            },
        });
    }

    async remove(id: number, companyId: number) {
        const review = await this.prisma.performanceReview.findFirst({ where: { id, companyId } });
        if (!review) throw new NotFoundException('Review not found');
        return this.prisma.performanceReview.delete({ where: { id } });
    }
}
