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
        return this.employeesService.findAll(req.user.companyId);
    }

    @Get('stats')
    getStats(@Request() req) {
        return this.employeesService.getStats(req.user.companyId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.employeesService.findOne(id, req.user.companyId);
    }

    @Post()
    create(@Body() dto: CreateEmployeeDto, @Request() req) {
        return this.employeesService.create(dto, req.user.companyId);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto, @Request() req) {
        return this.employeesService.update(id, dto, req.user.companyId);
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
