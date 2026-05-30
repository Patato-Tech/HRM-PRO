import { Controller, Get, Post, Put, Body, Param, Request, UseGuards } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto, CreateLeaveBalanceDto } from './dto/leave.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('leaves')
export class LeavesController {
    constructor(private leavesService: LeavesService) { }

    @Get()
    findAll(@Request() req) {
        return this.leavesService.findAll(req.user.companyId);
    }

    @Get('pending')
    findPending(@Request() req) {
        return this.leavesService.findPending(req.user.companyId);
    }

    @Get('employee/:id')
    findByEmployee(@Param('id') id: string, @Request() req) {
        return this.leavesService.findByEmployee(id, req.user.companyId);
    }

    @Get('balance/:id')
    getBalance(@Param('id') id: string, @Request() req) {
        return this.leavesService.getBalance(id, req.user.companyId);
    }

    @Post()
    create(@Body() dto: CreateLeaveDto, @Request() req) {
        return this.leavesService.create(dto, req.user.companyId);
    }

    @Put(':id/approve')
    approve(@Param('id') id: string, @Request() req) {
        return this.leavesService.approve(id, req.user.companyId, req.user.userId);
    }

    @Put(':id/reject')
    reject(@Param('id') id: string, @Request() req) {
        return this.leavesService.reject(id, req.user.companyId);
    }

    @Post('balance')
    createBalance(@Body() dto: CreateLeaveBalanceDto, @Request() req) {
        return this.leavesService.createBalance(dto, req.user.companyId);
    }
}
