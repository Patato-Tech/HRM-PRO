import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
    constructor(private employeesService: EmployeesService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.employeesService.findAll(
            req.user.companyId,
            req.user.role,
            req.user.userId,
            req.user.departmentId ?? null,
        );
    }

    @Get('stats')
    getStats(@Request() req: any) {
        return this.employeesService.getStats(
            req.user.companyId,
            req.user.role,
            req.user.departmentId ?? null,
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.findOne(
            id,
            req.user.companyId,
            req.user.role,
            req.user.userId,
            req.user.departmentId ?? null,
        );
    }

    @Post()
    create(@Body() dto: CreateEmployeeDto, @Request() req: any) {
        return this.employeesService.create(
            dto,
            req.user.companyId,
            req.user.role,
            req.user.departmentId ?? null,
        );
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto, @Request() req: any) {
        return this.employeesService.update(
            id,
            dto,
            req.user.companyId,
            req.user.role,
            req.user.departmentId ?? null,
        );
    }

    // Increment salary — Company Admin (HR/DeptMgr/Employee), HR (DeptMgr/Employee only)
    @Put(':id/increment-salary')
    incrementSalary(
        @Param('id') id: string,
        @Body() body: { amount: number },
        @Request() req: any,
    ) {
        return this.employeesService.incrementSalary(
            id,
            body.amount,
            req.user.companyId,
            req.user.role,
        );
    }

    // Reset password — Company Admin resets HR/DeptMgr, HR resets Employee, DeptMgr resets own dept Employee
    @Put(':id/reset-password')
    resetPassword(
        @Param('id') id: string,
        @Body() body: { newPassword: string },
        @Request() req: any,
    ) {
        return this.employeesService.resetPassword(
            id,
            body.newPassword,
            req.user.companyId,
            req.user.role,
            req.user.departmentId ?? null,
        );
    }

    @Put(':id/deactivate')
    deactivate(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.deactivate(
            id,
            req.user.companyId,
            req.user.role,
            req.user.departmentId ?? null,
        );
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.remove(
            id,
            req.user.companyId,
            req.user.role,
        );
    }
}
