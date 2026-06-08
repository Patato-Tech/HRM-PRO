import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/permissions.guard';

@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentsController {
    constructor(private departmentsService: DepartmentsService) { }

    @Get()
    @RequirePermission('departments', 'view')
    findAll(@Request() req) {
        return this.departmentsService.findAll(Number(req.user.companyId));
    }

    @Get(':id')
    @RequirePermission('departments', 'view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.departmentsService.findOne(parseInt(id), Number(req.user.companyId));
    }

    @Post()
    @RequirePermission('departments', 'create')
    create(@Body() dto: CreateDepartmentDto, @Request() req) {
        return this.departmentsService.create(dto, Number(req.user.companyId));
    }

    @Put(':id')
    @RequirePermission('departments', 'edit')
    update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @Request() req) {
        return this.departmentsService.update(parseInt(id), dto, Number(req.user.companyId));
    }

    @Delete(':id')
    @RequirePermission('departments', 'delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.departmentsService.remove(parseInt(id), Number(req.user.companyId));
    }

    @Put(':id/toggle-status')
    @RequirePermission('departments', 'edit')
    toggleStatus(@Param('id') id: string, @Request() req) {
        return this.departmentsService.toggleStatus(parseInt(id), Number(req.user.companyId));
    }
}
