import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/permissions.guard';

@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
    constructor(private employeesService: EmployeesService) { }

    @Get()
    @RequirePermission('employees', 'view')
    findAll(@Request() req: any) {
        return this.employeesService.findAll(
            Number(req.user.companyId), req.user.role,
            Number(req.user.userId),
            req.user.departmentId ? Number(req.user.departmentId) : null,
            req.user.customRoleScope || null,
        );
    }

    @Get('stats')
    @RequirePermission('employees', 'view')
    getStats(@Request() req: any) {
        return this.employeesService.getStats(
            Number(req.user.companyId), req.user.role,
            req.user.departmentId ? Number(req.user.departmentId) : null,
            req.user.customRoleScope || null,
        );
    }

    @Get(':id')
    @RequirePermission('employees', 'view')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.findOne(
            parseInt(id), Number(req.user.companyId), req.user.role,
            Number(req.user.userId),
            req.user.departmentId ? Number(req.user.departmentId) : null,
        );
    }

    @Post()
    @RequirePermission('employees', 'create')
    create(@Body() dto: CreateEmployeeDto, @Request() req: any) {
        return this.employeesService.create(
            dto, Number(req.user.companyId), req.user.role,
            req.user.departmentId ? Number(req.user.departmentId) : null,
        );
    }

    @Put(':id')
    @RequirePermission('employees', 'edit')
    update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto, @Request() req: any) {
        return this.employeesService.update(
            parseInt(id), dto, Number(req.user.companyId), req.user.role,
            req.user.departmentId ? Number(req.user.departmentId) : null,
        );
    }

    @Put(':id/increment-salary')
    @RequirePermission('employees', 'edit')
    incrementSalary(@Param('id') id: string, @Body() body: { amount: number }, @Request() req: any) {
        return this.employeesService.incrementSalary(
            parseInt(id), body.amount, Number(req.user.companyId), req.user.role,
        );
    }

    @Put(':id/reset-password')
    @RequirePermission('employees', 'edit')
    resetPassword(@Param('id') id: string, @Body() body: { newPassword: string }, @Request() req: any) {
        return this.employeesService.resetPassword(
            parseInt(id), body.newPassword, Number(req.user.companyId), req.user.role,
            req.user.departmentId ? Number(req.user.departmentId) : null,
        );
    }

    @Put(':id/deactivate')
    @RequirePermission('employees', 'edit')
    deactivate(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.deactivate(
            parseInt(id), Number(req.user.companyId), req.user.role,
            req.user.departmentId ? Number(req.user.departmentId) : null,
        );
    }

    @Delete(':id')
    @RequirePermission('employees', 'delete')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.remove(parseInt(id), Number(req.user.companyId), req.user.role);
    }
}
