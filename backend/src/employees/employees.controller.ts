import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
    constructor(private employeesService: EmployeesService) { }

    @Get()
    findAll(@Request() req) {
        return this.employeesService.findAll(
            req.user.companyId,
            req.user.role,
            req.user.departmentId,
            req.user.employeeId,   // ✅ pass employeeId for Employee isolation
        );
    }

    @Get('stats')
    getStats(@Request() req) {
        return this.employeesService.getStats(req.user.companyId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.employeesService.findOne(
            id,
            req.user.companyId,
            req.user.role,
            req.user.departmentId,
            req.user.employeeId,
        );
    }

    @Post()
    create(@Body() dto: CreateEmployeeDto, @Request() req) {
        return this.employeesService.create(
            dto,
            req.user.companyId,
            req.user.role,
            req.user.departmentId,
        );
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto, @Request() req) {
        return this.employeesService.update(
            id,
            dto,
            req.user.companyId,
            req.user.role,
            req.user.departmentId,
        );
    }

    @Put(':id/reset-password')
    resetPassword(@Param('id') id: string, @Body() body: { newPassword: string }, @Request() req) {
        return this.employeesService.resetPassword(
            id,
            body.newPassword,
            req.user.companyId,
            req.user.role,
            req.user.departmentId,
        );
    }

    // ✅ Salary increment endpoint
    @Put(':id/increment')
    incrementSalary(@Param('id') id: string, @Body() body: { amount: number }, @Request() req) {
        return this.employeesService.incrementSalary(
            id,
            body.amount,
            req.user.companyId,
            req.user.role,
        );
    }

    @Put(':id/deactivate')
    deactivate(@Param('id') id: string, @Request() req) {
        return this.employeesService.deactivate(id, req.user.companyId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.employeesService.remove(id, req.user.companyId);
    }
}
