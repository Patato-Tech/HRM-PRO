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
        return this.employeesService.findAll(Number(req.user.companyId), req.user);
    }

    @Get('stats')
    getStats(@Request() req: any) {
        return this.employeesService.getStats(Number(req.user.companyId), req.user);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.findOne(parseInt(id), Number(req.user.companyId), req.user);
    }

    @Post()
    create(@Body() dto: CreateEmployeeDto, @Request() req: any) {
        return this.employeesService.create(dto, Number(req.user.companyId), req.user);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto, @Request() req: any) {
        return this.employeesService.update(parseInt(id), dto, Number(req.user.companyId), req.user);
    }

    @Put(':id/increment-salary')
    incrementSalary(@Param('id') id: string, @Body() body: { amount: number }, @Request() req: any) {
        return this.employeesService.incrementSalary(parseInt(id), body.amount, Number(req.user.companyId), req.user);
    }

    @Put(':id/reset-password')
    resetPassword(@Param('id') id: string, @Body() body: { newPassword: string }, @Request() req: any) {
        return this.employeesService.resetPassword(parseInt(id), body.newPassword, Number(req.user.companyId), req.user);
    }

    @Put(':id/deactivate')
    deactivate(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.deactivate(parseInt(id), Number(req.user.companyId), req.user);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.remove(parseInt(id), Number(req.user.companyId), req.user);
    }
}
