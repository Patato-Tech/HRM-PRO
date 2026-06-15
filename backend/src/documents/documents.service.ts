import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: number, user: any) {
        const where: any = { companyId };
        if (user.customRoleScope === 'own_department' && user.departmentId) {
            where.employee = { departmentId: Number(user.departmentId) };
        }
        return this.prisma.document.findMany({
            where,
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true } },
                        department: { select: { id: true, name: true } },
                    },
                },
                uploadedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByEmployee(employeeId: number, companyId: number) {
        return this.prisma.document.findMany({
            where: { employeeId, companyId },
            include: {
                uploadedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(dto: any, companyId: number, user: any) {
        return this.prisma.document.create({
            data: {
                companyId,
                employeeId: Number(dto.employeeId),
                type: dto.type,
                name: dto.name,
                url: dto.url,
                expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
                notes: dto.notes,
                uploadedById: Number(user.userId),
            },
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true } },
                        department: { select: { name: true } },
                    },
                },
                uploadedBy: { select: { id: true, name: true } },
            },
        });
    }

    async update(id: number, dto: any, companyId: number) {
        const doc = await this.prisma.document.findFirst({ where: { id, companyId } });
        if (!doc) throw new NotFoundException('Document not found');
        return this.prisma.document.update({
            where: { id },
            data: {
                type: dto.type ?? doc.type,
                name: dto.name ?? doc.name,
                url: dto.url ?? doc.url,
                expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : doc.expiryDate,
                notes: dto.notes ?? doc.notes,
            },
        });
    }

    async remove(id: number, companyId: number) {
        const doc = await this.prisma.document.findFirst({ where: { id, companyId } });
        if (!doc) throw new NotFoundException('Document not found');
        return this.prisma.document.delete({ where: { id } });
    }
}
