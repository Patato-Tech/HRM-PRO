import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: number) {
        return this.prisma.department.findMany({
            where: { companyId },
            include: {
                _count: { select: { employees: true } },
                employees: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        customRole: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number, companyId: number) {
        const department = await this.prisma.department.findFirst({
            where: { id, companyId },
            include: {
                employees: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        customRole: true,
                    },
                },
            },
        });
        if (!department) throw new NotFoundException('Department not found');
        return department;
    }

    async create(dto: CreateDepartmentDto, companyId: number) {
        return this.prisma.department.create({
            data: {
                name: dto.name,
                headId: dto.headId ? Number(dto.headId) : null,
                companyId,
            },
        });
    }

    async update(id: number, dto: UpdateDepartmentDto, companyId: number) {
        const department = await this.prisma.department.findFirst({ where: { id, companyId } });
        if (!department) throw new NotFoundException('Department not found');
        return this.prisma.department.update({
            where: { id },
            data: {
                name: dto.name,
                headId: dto.headId ? Number(dto.headId) : null,
            },
        });
    }

    async remove(id: number, companyId: number) {
        const department = await this.prisma.department.findFirst({ where: { id, companyId } });
        if (!department) throw new NotFoundException('Department not found');
        await this.prisma.department.delete({ where: { id } });
        return { message: 'Department deleted successfully' };
    }

    async toggleStatus(id: number, companyId: number) {
        const department = await this.prisma.department.findFirst({ where: { id, companyId } });
        if (!department) throw new NotFoundException('Department not found');
        const newStatus = department.status === 'active' ? 'inactive' : 'active';
        await this.prisma.department.update({ where: { id }, data: { status: newStatus } });
        return { message: `Department ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, status: newStatus };
    }
}