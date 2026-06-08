import { Controller, Get, Post, Put, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/payroll.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/permissions.guard';

@UseGuards(JwtAuthGuard)
@Controller('payroll')
export class PayrollController {
    constructor(private payrollService: PayrollService) { }

    @Get()
    @RequirePermission('payroll', 'view')
    findAll(@Request() req: any) {
        return this.payrollService.findAll(
            Number(req.user.companyId),
            req.user.role,
            Number(req.user.userId),
            req.user.employeeId ? Number(req.user.employeeId) : null,
        );
    }

    @Get('summary')
    @RequirePermission('payroll', 'view')
    getSummary(@Request() req: any) {
        return this.payrollService.getSummary(Number(req.user.companyId), req.user.role);
    }

    @Get('month')
    @RequirePermission('payroll', 'view')
    findByMonth(@Query('month') month: string, @Query('year') year: string, @Request() req: any) {
        return this.payrollService.findByMonth(
            +month, +year,
            Number(req.user.companyId),
            req.user.role,
            req.user.employeeId ? Number(req.user.employeeId) : null,
        );
    }

    @Get('employee/:id')
    @RequirePermission('payroll', 'view')
    findByEmployee(@Param('id') id: string, @Request() req: any) {
        return this.payrollService.findByEmployee(
            parseInt(id),
            Number(req.user.companyId),
            req.user.role,
            req.user.employeeId ? Number(req.user.employeeId) : null,
        );
    }

    @Get('payslip/:employeeId')
    getPayslip(
        @Param('employeeId') employeeId: string,
        @Query('month') month: string,
        @Query('year') year: string,
        @Request() req: any,
    ) {
        return this.payrollService.getPayslip(
            parseInt(employeeId), +month, +year,
            Number(req.user.companyId),
            req.user.role,
            req.user.employeeId ? Number(req.user.employeeId) : null,
        );
    }

    @Post()
    @RequirePermission('payroll', 'process')
    create(@Body() dto: CreatePayrollDto, @Request() req: any) {
        return this.payrollService.create(dto, Number(req.user.companyId), req.user.role);
    }

    @Post('deduction-rules')
    setDeductionRule(@Body() dto: { type: string; deductPercentage: number; isActive: boolean }, @Request() req: any) {
        return this.payrollService.setDeductionRule(Number(req.user.companyId), req.user.role, dto);
    }

    @Get('deduction-rules')
    getDeductionRules(@Request() req: any) {
        return this.payrollService.getDeductionRules(Number(req.user.companyId), req.user.role);
    }

    @Put('increment/:employeeId')
    incrementSalary(@Param('employeeId') employeeId: string, @Body() body: { amount: number }, @Request() req: any) {
        return this.payrollService.incrementSalary(
            parseInt(employeeId), body.amount,
            Number(req.user.companyId), req.user.role,
        );
    }

    @Put(':id')
    @RequirePermission('payroll', 'process')
    update(@Param('id') id: string, @Body() dto: UpdatePayrollDto, @Request() req: any) {
        return this.payrollService.update(parseInt(id), dto, Number(req.user.companyId), req.user.role);
    }

    @Put(':id/approve')
    @RequirePermission('payroll', 'approve')
    approve(@Param('id') id: string, @Request() req: any) {
        return this.payrollService.approve(parseInt(id), Number(req.user.companyId), req.user.role);
    }
}
