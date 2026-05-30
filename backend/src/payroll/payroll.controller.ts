import { Controller, Get, Post, Put, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/payroll.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payroll')
export class PayrollController {
    constructor(private payrollService: PayrollService) { }

    @Get()
    findAll(@Request() req) {
        return this.payrollService.findAll(req.user.companyId);
    }

    @Get('summary')
    getSummary(@Request() req) {
        return this.payrollService.getSummary(req.user.companyId);
    }

    @Get('month')
    findByMonth(
        @Query('month') month: string,
        @Query('year') year: string,
        @Request() req,
    ) {
        return this.payrollService.findByMonth(+month, +year, req.user.companyId);
    }

    @Get('employee/:id')
    findByEmployee(@Param('id') id: string, @Request() req) {
        return this.payrollService.findByEmployee(id, req.user.companyId);
    }

    @Post()
    create(@Body() dto: CreatePayrollDto, @Request() req) {
        return this.payrollService.create(dto, req.user.companyId);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePayrollDto, @Request() req) {
        return this.payrollService.update(id, dto, req.user.companyId);
    }

    @Put(':id/approve')
    approve(@Param('id') id: string, @Request() req) {
        return this.payrollService.approve(id, req.user.companyId);
    }
}
