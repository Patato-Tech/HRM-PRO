import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { PlatformLoginDto, UpdateCompanyDto } from './dto/platform.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('platform')
export class PlatformController {
    constructor(private platformService: PlatformService) { }

    @Post('auth/login')
    login(@Body() dto: PlatformLoginDto) {
        return this.platformService.login(dto);
    }

    @Post('register')
    registerCompany(@Body() body: {
        companyName: string; industry?: string; address?: string;
        adminName: string; adminEmail: string; adminPassword: string;
    }) {
        return this.platformService.registerCompany(body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats')
    getStats() { return this.platformService.getStats(); }

    @UseGuards(JwtAuthGuard)
    @Get('companies')
    getCompanies() { return this.platformService.getCompanies(); }

    @UseGuards(JwtAuthGuard)
    @Get('companies/pending')
    getPendingCompanies() { return this.platformService.getPendingCompanies(); }

    @UseGuards(JwtAuthGuard)
    @Put('companies/:id/approve')
    approveCompany(@Param('id') id: string) { return this.platformService.approveCompany(id); }

    @UseGuards(JwtAuthGuard)
    @Delete('companies/:id/reject')
    rejectCompany(@Param('id') id: string) { return this.platformService.rejectCompany(id); }

    @UseGuards(JwtAuthGuard)
    @Put('companies/:id')
    updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
        return this.platformService.updateCompany(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('companies/:id')
    deleteCompany(@Param('id') id: string) { return this.platformService.deleteCompany(id); }

    @UseGuards(JwtAuthGuard)
    @Put('companies/:id/reset-password')
    resetCompanyAdminPassword(@Param('id') id: string, @Body() body: { newPassword: string }) {
        return this.platformService.resetCompanyAdminPassword(id, body.newPassword);
    }
}
