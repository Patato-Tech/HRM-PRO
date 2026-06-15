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
        return this.attendanceService.getTodaySummary(Number(req.user.companyId), req.user);
    }

    @Get('company-settings')
    getSettings(@Request() req) {
        return this.settingsService.getSettings(Number(req.user.companyId));
    }

    @Put('company-settings')
    updateSettings(@Body() dto: any, @Request() req) {
        return this.settingsService.updateSettings(Number(req.user.companyId), dto.workingDays, dto.timezone);
    }

    @Get('company-holidays')
    getHolidays(@Request() req) {
        return this.settingsService.getHolidays(Number(req.user.companyId));
    }

    @Post('company-holidays')
    addHoliday(@Body() dto: any, @Request() req) {
        return this.settingsService.addHoliday(Number(req.user.companyId), dto.name, dto.startDate, dto.endDate);
    }

    @Delete('company-holidays/:id')
    deleteHoliday(@Param('id') id: string, @Request() req) {
        return this.settingsService.deleteHoliday(parseInt(id), Number(req.user.companyId));
    }

    @Get('shift')
    getShift(@Request() req, @Query('departmentId') departmentId?: string) {
        return this.attendanceService.getShift(Number(req.user.companyId), departmentId);
    }

    @Get('date/:date')
    findByDate(@Param('date') date: string, @Request() req) {
        return this.attendanceService.findByDate(date, Number(req.user.companyId), req.user);
    }

    @Get('employee/:id')
    findByEmployee(@Param('id') id: string, @Request() req) {
        return this.attendanceService.findByEmployee(parseInt(id), Number(req.user.companyId));
    }

    @Get()
    findAll(@Request() req) {
        return this.attendanceService.findAll(Number(req.user.companyId), req.user);
    }

    @Post('manual')
    manualMark(@Body() dto: any, @Request() req) {
        return this.attendanceService.manualMark(dto, Number(req.user.companyId), req.user);
    }

    @Post('checkin')
    checkIn(@Request() req) {
        return this.attendanceService.checkIn(Number(req.user.employeeId), Number(req.user.companyId));
    }

    @Post('checkout')
    checkOut(@Request() req) {
        return this.attendanceService.checkOut(Number(req.user.employeeId), Number(req.user.companyId));
    }

    @Post('shift')
    setShift(@Body() dto: any, @Request() req) {
        return this.attendanceService.setShift(dto, Number(req.user.companyId), Number(req.user.userId));
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: any, @Request() req) {
        return this.attendanceService.update(parseInt(id), dto, Number(req.user.companyId), req.user);
    }
}
