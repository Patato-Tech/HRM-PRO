import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const DEFAULT_PERMISSIONS = {
  employees: { view: false, create: false, edit: false, delete: false },
  departments: { view: false, create: false, edit: false, delete: false },
  attendance: { view: false, manage: false },
  leaves: { view: false, approve: false, manage: false },
  payroll: { view: false, process: false, approve: false },
  reports: { view: false },
  performance: { view: false, manage: false, review: false },
  recruitment: { view: false, manage: false, hire: false },
  training: { view: false, manage: false, assign: false },
  documents: { view: false, upload: false, delete: false },
};

export const DEFAULT_ROLES = [
  {
    name: 'HR Manager',
    description: 'Manages HR operations across the company',
    isDefault: true,
    scope: 'all',
    permissions: {
      employees: { view: true, create: true, edit: true, delete: false },
      departments: { view: true, create: false, edit: false, delete: false },
      attendance: { view: true, manage: true },
      leaves: { view: true, approve: true, manage: true },
      payroll: { view: true, process: true, approve: false },
      reports: { view: true },
      performance: { view: true, manage: true, review: false },
      recruitment: { view: true, manage: true, hire: false },
      training: { view: true, manage: true, assign: true },
      documents: { view: true, upload: true, delete: false },
    },
  },
  {
    name: 'Department Manager',
    description: 'Manages employees within their own department',
    isDefault: true,
    scope: 'own_department',
    permissions: {
      employees: { view: true, create: false, edit: true, delete: false },
      departments: { view: true, create: false, edit: false, delete: false },
      attendance: { view: true, manage: false },
      leaves: { view: true, approve: true, manage: false },
      payroll: { view: false, process: false, approve: false },
      reports: { view: true },
      performance: { view: true, manage: false, review: true },
      recruitment: { view: false, manage: false, hire: false },
      training: { view: true, manage: false, assign: false },
      documents: { view: true, upload: false, delete: false },
    },
  },
];

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: number) {
    return this.prisma.role.findMany({
      where: { companyId },
      include: { _count: { select: { employees: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: number, companyId: number) {
    const role = await this.prisma.role.findFirst({ where: { id, companyId } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(companyId: number, dto: { name: string; description?: string; scope?: string; permissions: any }) {
    const existing = await this.prisma.role.findFirst({ where: { companyId, name: dto.name } });
    if (existing) throw new ConflictException(`Role "${dto.name}" already exists`);

    return this.prisma.role.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        scope: dto.scope || 'all',
        permissions: dto.permissions,
        isDefault: false,
      },
    });
  }

  async update(id: number, companyId: number, dto: { name?: string; description?: string; scope?: string; permissions?: any }) {
    const role = await this.prisma.role.findFirst({ where: { id, companyId } });
    if (!role) throw new NotFoundException('Role not found');

    return this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name ?? role.name,
        description: dto.description ?? role.description,
        scope: dto.scope ?? role.scope,
        permissions: dto.permissions ?? role.permissions,
      },
    });
  }

  async remove(id: number, companyId: number) {
    const role = await this.prisma.role.findFirst({
      where: { id, companyId },
      include: { _count: { select: { employees: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role._count.employees > 0) throw new ForbiddenException(`Cannot delete role — ${role._count.employees} employee(s) are assigned to it`);

    await this.prisma.role.delete({ where: { id } });
    return { message: 'Role deleted successfully' };
  }

  async seedDefaultRoles(companyId: number) {
    for (const role of DEFAULT_ROLES) {
      const existing = await this.prisma.role.findFirst({ where: { companyId, name: role.name } });
      if (!existing) {
        await this.prisma.role.create({
          data: { companyId, ...role, permissions: role.permissions as any },
        });
      }
    }
  }

  async getDefaultPermissions() {
    return DEFAULT_PERMISSIONS;
  }
}
