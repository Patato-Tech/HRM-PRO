import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
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
    getStats(@Request() req) {
        return this.platformService.getStats(req.user.sub, req.user.role);
    }

    @UseGuards(JwtAuthGuard)
    @Get('companies')
    getCompanies(@Request() req) {
        return this.platformService.getCompanies(req.user.sub, req.user.role);
    }

    @UseGuards(JwtAuthGuard)
    @Get('companies/:id/users')
    getCompanyUsers(@Param('id') id: string, @Request() req) {
        return this.platformService.getCompanyUsers(id, req.user.sub, req.user.role);
    }

    @UseGuards(JwtAuthGuard)
    @Post('companies')
    createCompany(@Body() dto: CreateCompanyDto, @Request() req) {
        return this.platformService.createCompany(dto, req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Put('companies/:id')
    updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto, @Request() req) {
        return this.platformService.updateCompany(id, dto, req.user.sub, req.user.role);
    }

    // ✅ Hard delete endpoint
    @UseGuards(JwtAuthGuard)
    @Delete('companies/:id')
    deleteCompany(@Param('id') id: string, @Request() req) {
        return this.platformService.deleteCompany(id, req.user.sub, req.user.role);
    }

    // ✅ Reset Company Admin password
    @UseGuards(JwtAuthGuard)
    @Put('companies/:id/reset-password')
    resetCompanyAdminPassword(
        @Param('id') id: string,
        @Body() body: { newPassword: string },
        @Request() req,
    ) {
        return this.platformService.resetCompanyAdminPassword(
            id, body.newPassword, req.user.sub, req.user.role,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('transfer')
    transferEmployee(@Body() dto: TransferEmployeeDto) {
        return this.platformService.transferEmployee(dto.employeeId, dto.toCompanyId);
    }
}
