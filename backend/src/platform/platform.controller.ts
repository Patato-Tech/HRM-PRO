import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { PlatformLoginDto, CreateCompanyDto, UpdateCompanyDto, TransferEmployeeDto } from './dto/platform.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('platform')
export class PlatformController {
    constructor(private platformService: PlatformService) { }

    @Post('auth/login')
    login(@Body() dto: PlatformLoginDto) {
        return this.platformService.login(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats')
    getStats() {
        return this.platformService.getStats();
    }

    @UseGuards(JwtAuthGuard)
    @Get('companies')
    getCompanies() {
        return this.platformService.getCompanies();
    }

    @UseGuards(JwtAuthGuard)
    @Get('analytics')
    getAnalytics() {
        return this.platformService.getAnalytics();
    }

    @UseGuards(JwtAuthGuard)
    @Get('companies/:id/users')
    getCompanyUsers(@Param('id') id: string) {
        return this.platformService.getCompanyUsers(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('companies')
    createCompany(@Body() dto: CreateCompanyDto) {
        return this.platformService.createCompany(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Put('companies/:id')
    updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
        return this.platformService.updateCompany(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('companies/:id')
    deleteCompany(@Param('id') id: string) {
        return this.platformService.deleteCompany(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('transfer')
    transferEmployee(@Body() dto: TransferEmployeeDto) {
        return this.platformService.transferEmployee(dto.employeeId, dto.toCompanyId);
    }
}
