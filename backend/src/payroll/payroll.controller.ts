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
        return this.payrollService.findAll(Number(req.user.companyId), req.user);
    }

    @Get('summary')
    getSummary(@Request() req: any) {
        return this.payrollService.getSummary(Number(req.user.companyId), req.user);
    }

    @Get('month')
    findByMonth(@Query('month') month: string, @Query('year') year: string, @Request() req: any) {
        return this.payrollService.findByMonth(+month, +year, Number(req.user.companyId), req.user);
    }

    @Get('employee/:id')
    findByEmployee(@Param('id') id: string, @Request() req: any) {
        return this.payrollService.findByEmployee(parseInt(id), Number(req.user.companyId), req.user);
    }

    @Get('payslip/:employeeId')
    getPayslip(
        @Param('employeeId') employeeId: string,
        @Query('month') month: string,
        @Query('year') year: string,
        @Request() req: any,
    ) {
        return this.payrollService.getPayslip(parseInt(employeeId), +month, +year, Number(req.user.companyId), req.user);
    }

    @Post()
    create(@Body() dto: CreatePayrollDto, @Request() req: any) {
        return this.payrollService.create(dto, Number(req.user.companyId), req.user);
    }

    @Post('deduction-rules')
    setDeductionRule(@Body() dto: { type: string; deductPercentage: number; isActive: boolean }, @Request() req: any) {
        return this.payrollService.setDeductionRule(Number(req.user.companyId), req.user, dto);
    }

    @Get('deduction-rules')
    getDeductionRules(@Request() req: any) {
        return this.payrollService.getDeductionRules(Number(req.user.companyId), req.user);
    }

    @Put('increment/:employeeId')
    incrementSalary(@Param('employeeId') employeeId: string, @Body() body: { amount: number }, @Request() req: any) {
        return this.payrollService.incrementSalary(parseInt(employeeId), body.amount, Number(req.user.companyId), req.user);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePayrollDto, @Request() req: any) {
        return this.payrollService.update(parseInt(id), dto, Number(req.user.companyId), req.user);
    }

    @Put(':id/approve')
    approve(@Param('id') id: string, @Request() req: any) {
        return this.payrollService.approve(parseInt(id), Number(req.user.companyId), req.user);
    }

    @Put(':id/paid')
    markPaid(@Param('id') id: string, @Request() req: any) {
        return this.payrollService.markPaid(parseInt(id), Number(req.user.companyId), req.user);
    }
}