import { Controller, Get, Post, Put, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/payroll.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payroll')
export class PayrollController {
    constructor(private payrollService: PayrollService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.payrollService.findAll(
            req.user.companyId,
            req.user.role,
            req.user.userId,
            req.user.employeeId ?? null,
        );
    }

    @Get('summary')
    getSummary(@Request() req: any) {
        return this.payrollService.getSummary(
            req.user.companyId,
            req.user.role,
        );
    }

    @Get('month')
    findByMonth(
        @Query('month') month: string,
        @Query('year') year: string,
        @Request() req: any,
    ) {
        return this.payrollService.findByMonth(
            +month,
            +year,
            req.user.companyId,
            req.user.role,
            req.user.employeeId ?? null,
        );
    }

    @Get('employee/:id')
    findByEmployee(@Param('id') id: string, @Request() req: any) {
        return this.payrollService.findByEmployee(
            id,
            req.user.companyId,
            req.user.role,
            req.user.employeeId ?? null,
        );
    }

    // GET payslip data for PDF — own only
    @Get('payslip/:employeeId')
    getPayslip(
        @Param('employeeId') employeeId: string,
        @Query('month') month: string,
        @Query('year') year: string,
        @Request() req: any,
    ) {
        return this.payrollService.getPayslip(
            employeeId,
            +month,
            +year,
            req.user.companyId,
            req.user.role,
            req.user.employeeId ?? null,
        );
    }

    @Post()
    create(@Body() dto: CreatePayrollDto, @Request() req: any) {
        return this.payrollService.create(
            dto,
            req.user.companyId,
            req.user.role,
        );
    }

    // Deduction rules — Company Admin only
    @Post('deduction-rules')
    setDeductionRule(
        @Body() dto: { type: string; deductPercentage: number; isActive: boolean },
        @Request() req: any,
    ) {
        return this.payrollService.setDeductionRule(
            req.user.companyId,
            req.user.role,
            dto,
        );
    }

    @Get('deduction-rules')
    getDeductionRules(@Request() req: any) {
        return this.payrollService.getDeductionRules(
            req.user.companyId,
            req.user.role,
        );
    }

    // Salary increment — Company Admin (all) + HR (DeptMgr/Employee only)
    @Put('increment/:employeeId')
    incrementSalary(
        @Param('employeeId') employeeId: string,
        @Body() body: { amount: number },
        @Request() req: any,
    ) {
        return this.payrollService.incrementSalary(
            employeeId,
            body.amount,
            req.user.companyId,
            req.user.role,
        );
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePayrollDto, @Request() req: any) {
        return this.payrollService.update(
            id,
            dto,
            req.user.companyId,
            req.user.role,
        );
    }

    @Put(':id/approve')
    approve(@Param('id') id: string, @Request() req: any) {
        return this.payrollService.approve(
            id,
            req.user.companyId,
            req.user.role,
        );
    }
}
