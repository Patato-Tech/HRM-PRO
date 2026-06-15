import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecruitmentService {
    constructor(private prisma: PrismaService) { }

    async findAllJobs(companyId: number) {
        return this.prisma.jobPosting.findMany({
            where: { companyId },
            include: {
                department: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
                applicants: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createJob(dto: any, companyId: number, user: any) {
        return this.prisma.jobPosting.create({
            data: {
                companyId,
                departmentId: dto.departmentId ? Number(dto.departmentId) : null,
                title: dto.title,
                description: dto.description,
                requirements: dto.requirements,
                salaryMin: dto.salaryMin ? Number(dto.salaryMin) : null,
                salaryMax: dto.salaryMax ? Number(dto.salaryMax) : null,
                status: 'open',
                createdById: Number(user.userId),
            },
            include: {
                department: { select: { id: true, name: true } },
            },
        });
    }

    async updateJob(id: number, dto: any, companyId: number) {
        const job = await this.prisma.jobPosting.findFirst({ where: { id, companyId } });
        if (!job) throw new NotFoundException('Job posting not found');
        return this.prisma.jobPosting.update({
            where: { id },
            data: {
                title: dto.title ?? job.title,
                description: dto.description ?? job.description,
                requirements: dto.requirements ?? job.requirements,
                salaryMin: dto.salaryMin !== undefined ? Number(dto.salaryMin) : job.salaryMin,
                salaryMax: dto.salaryMax !== undefined ? Number(dto.salaryMax) : job.salaryMax,
                status: dto.status ?? job.status,
                departmentId: dto.departmentId ? Number(dto.departmentId) : job.departmentId,
            },
        });
    }

    async removeJob(id: number, companyId: number) {
        const job = await this.prisma.jobPosting.findFirst({ where: { id, companyId } });
        if (!job) throw new NotFoundException('Job posting not found');
        await this.prisma.applicant.deleteMany({ where: { jobId: id } });
        return this.prisma.jobPosting.delete({ where: { id } });
    }

    async findApplicants(jobId: number, companyId: number) {
        return this.prisma.applicant.findMany({
            where: { jobId, companyId },
            include: { job: { select: { title: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createApplicant(dto: any, companyId: number) {
        return this.prisma.applicant.create({
            data: {
                companyId,
                jobId: Number(dto.jobId),
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                status: 'applied',
                notes: dto.notes,
            },
        });
    }

    async updateApplicant(id: number, dto: any, companyId: number) {
        const applicant = await this.prisma.applicant.findFirst({ where: { id, companyId } });
        if (!applicant) throw new NotFoundException('Applicant not found');
        return this.prisma.applicant.update({
            where: { id },
            data: {
                status: dto.status ?? applicant.status,
                interviewDate: dto.interviewDate ? new Date(dto.interviewDate) : applicant.interviewDate,
                notes: dto.notes ?? applicant.notes,
            },
        });
    }

    async removeApplicant(id: number, companyId: number) {
        const applicant = await this.prisma.applicant.findFirst({ where: { id, companyId } });
        if (!applicant) throw new NotFoundException('Applicant not found');
        return this.prisma.applicant.delete({ where: { id } });
    }
}
