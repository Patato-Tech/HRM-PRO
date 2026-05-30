import { Controller, Get, Post, Put, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
    constructor(private attendanceService: AttendanceService) { }

    @Get()
    findAll(@Request() req) {
        return this.attendanceService.findAll(req.user.companyId);
    }

    @Get('summary/today')
    getTodaySummary(@Request() req) {
        return this.attendanceService.getTodaySummary(req.user.companyId);
    }

    @Get('date/:date')
    findByDate(@Param('date') date: string, @Request() req) {
        return this.attendanceService.findByDate(date, req.user.companyId);
    }

    @Get('employee/:id')
    findByEmployee(@Param('id') id: string, @Request() req) {
        return this.attendanceService.findByEmployee(id, req.user.companyId);
    }

    @Post()
    create(@Body() dto: CreateAttendanceDto, @Request() req) {
        return this.attendanceService.create(dto, req.user.companyId);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto, @Request() req) {
        return this.attendanceService.update(id, dto, req.user.companyId);
    }
}
