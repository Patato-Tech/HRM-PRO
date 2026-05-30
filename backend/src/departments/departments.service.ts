import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
    constructor(private prisma: PrismaService) { }

    async findAll(companyId: string) {
        return this.prisma.department.findMany({
            where: { companyId },
            include: {
                _count: { select: { employees: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, companyId: string) {
        const department = await this.prisma.department.findFirst({
            where: { id, companyId },
            include: {
                employees: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });
        if (!department) throw new NotFoundException('Department not found');
        return department;
    }

    async create(dto: CreateDepartmentDto, companyId: string) {
        return this.prisma.department.create({
            data: {
                name: dto.name,
                headId: dto.headId,
                companyId,
            },
        });
    }

    async update(id: string, dto: UpdateDepartmentDto, companyId: string) {
        const department = await this.prisma.department.findFirst({ where: { id, companyId } });
        if (!department) throw new NotFoundException('Department not found');

        return this.prisma.department.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string, companyId: string) {
        const department = await this.prisma.department.findFirst({ where: { id, companyId } });
        if (!department) throw new NotFoundException('Department not found');

        await this.prisma.department.delete({ where: { id } });
        return { message: 'Department deleted successfully' };
    }
}
