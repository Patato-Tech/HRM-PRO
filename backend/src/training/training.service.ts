import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: number, user: any) {
        const where: any = { companyId };
        if (user.customRoleScope === 'own_department' && user.departmentId) {
            where.departmentId = Number(user.departmentId);
        }
        return this.prisma.trainingProgram.findMany({
            where,
            include: {
                department: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
                enrollments: {
                    include: {
                        employee: {
                            include: {
                                user: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(dto: any, companyId: number, user: any) {
        return this.prisma.trainingProgram.create({
            data: {
                companyId,
                departmentId: dto.departmentId ? Number(dto.departmentId) : null,
                title: dto.title,
                description: dto.description,
                trainerName: dto.trainerName,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                maxParticipants: dto.maxParticipants ? Number(dto.maxParticipants) : null,
                status: 'upcoming',
                createdById: Number(user.userId),
            },
            include: {
                department: { select: { id: true, name: true } },
            },
        });
    }

    async update(id: number, dto: any, companyId: number) {
        const program = await this.prisma.trainingProgram.findFirst({ where: { id, companyId } });
        if (!program) throw new NotFoundException('Training program not found');
        return this.prisma.trainingProgram.update({
            where: { id },
            data: {
                title: dto.title ?? program.title,
                description: dto.description ?? program.description,
                trainerName: dto.trainerName ?? program.trainerName,
                startDate: dto.startDate ? new Date(dto.startDate) : program.startDate,
                endDate: dto.endDate ? new Date(dto.endDate) : program.endDate,
                maxParticipants: dto.maxParticipants ? Number(dto.maxParticipants) : program.maxParticipants,
                status: dto.status ?? program.status,
                departmentId: dto.departmentId !== undefined ? (dto.departmentId ? Number(dto.departmentId) : null) : program.departmentId,
            },
        });
    }

    async remove(id: number, companyId: number) {
        const program = await this.prisma.trainingProgram.findFirst({ where: { id, companyId } });
        if (!program) throw new NotFoundException('Training program not found');
        await this.prisma.trainingEnrollment.deleteMany({ where: { programId: id } });
        return this.prisma.trainingProgram.delete({ where: { id } });
    }

    async enroll(programId: number, employeeId: number, companyId: number) {
        const existing = await this.prisma.trainingEnrollment.findFirst({
            where: { programId, employeeId, companyId },
        });
        if (existing) return existing;
        return this.prisma.trainingEnrollment.create({
            data: { companyId, programId, employeeId, status: 'pending' },
        });
    }

    async updateEnrollment(id: number, dto: any, companyId: number) {
        const enrollment = await this.prisma.trainingEnrollment.findFirst({ where: { id, companyId } });
        if (!enrollment) throw new NotFoundException('Enrollment not found');
        return this.prisma.trainingEnrollment.update({
            where: { id },
            data: {
                status: dto.status ?? enrollment.status,
                completedAt: dto.status === 'completed' ? new Date() : enrollment.completedAt,
            },
        });
    }

    async removeEnrollment(id: number, companyId: number) {
        const enrollment = await this.prisma.trainingEnrollment.findFirst({ where: { id, companyId } });
        if (!enrollment) throw new NotFoundException('Enrollment not found');
        return this.prisma.trainingEnrollment.delete({ where: { id } });
    }
}
