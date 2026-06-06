import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
    constructor(
        private attendanceService: AttendanceService,
        private settingsService: SettingsService,
    ) { }

    @Get('summary/today')
    getTodaySummary(@Request() req) {
        return this.attendanceService.getTodaySummary(req.user.companyId);
    }

    @Get('company-settings')
    getSettings(@Request() req) {
        return this.settingsService.getSettings(req.user.companyId);
    }

    @Put('company-settings')
    updateSettings(@Body() dto: any, @Request() req) {
        return this.settingsService.updateSettings(req.user.companyId, dto.workingDays, dto.timezone);
    }

    @Get('company-holidays')
    getHolidays(@Request() req) {
        return this.settingsService.getHolidays(req.user.companyId);
    }

    @Post('company-holidays')
    addHoliday(@Body() dto: any, @Request() req) {
        return this.settingsService.addHoliday(req.user.companyId, dto.name, dto.startDate, dto.endDate);
    }

    @Delete('company-holidays/:id')
    deleteHoliday(@Param('id') id: string, @Request() req) {
        return this.settingsService.deleteHoliday(id, req.user.companyId);
    }

    @Get('shift')
    getShift(@Request() req, @Query('departmentId') departmentId?: string) {
        return this.attendanceService.getShift(req.user.companyId, departmentId);
    }

    @Get('date/:date')
    findByDate(@Param('date') date: string, @Request() req) {
        return this.attendanceService.findByDate(date, req.user.companyId);
    }

    @Get('employee/:id')
    findByEmployee(@Param('id') id: string, @Request() req) {
        return this.attendanceService.findByEmployee(id, req.user.companyId);
    }

    @Get()
    findAll(@Request() req) {
        return this.attendanceService.findAll(req.user.companyId, req.user.role, req.user.departmentId);
    }

    @Post('checkin')
    checkIn(@Request() req) {
        return this.attendanceService.checkIn(req.user.employeeId, req.user.companyId);
    }

    @Post('checkout')
    checkOut(@Request() req) {
        return this.attendanceService.checkOut(req.user.employeeId, req.user.companyId);
    }

    @Post('shift')
    setShift(@Body() dto: any, @Request() req) {
        return this.attendanceService.setShift(dto, req.user.companyId, req.user.userId);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: any, @Request() req) {
        return this.attendanceService.update(id, dto, req.user.companyId);
    }
}
