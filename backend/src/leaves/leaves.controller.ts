import { Controller, Get, Post, Put, Body, Param, Request, UseGuards } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto, CreateLeaveBalanceDto } from './dto/leave.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/permissions.guard';

@UseGuards(JwtAuthGuard)
@Controller('leaves')
export class LeavesController {
    constructor(private leavesService: LeavesService) { }

    @Get()
    @RequirePermission('leaves', 'view')
    findAll(@Request() req) {
        return this.leavesService.findAll(Number(req.user.companyId));
    }

    @Get('pending')
    @RequirePermission('leaves', 'view')
    findPending(@Request() req) {
        return this.leavesService.findPending(Number(req.user.companyId));
    }

    @Get('employee/:id')
    @RequirePermission('leaves', 'view')
    findByEmployee(@Param('id') id: string, @Request() req) {
        return this.leavesService.findByEmployee(parseInt(id), Number(req.user.companyId));
    }

    @Get('balance/:id')
    @RequirePermission('leaves', 'view')
    getBalance(@Param('id') id: string, @Request() req) {
        return this.leavesService.getBalance(parseInt(id), Number(req.user.companyId));
    }

    @Post()
    @RequirePermission('leaves', 'manage')
    create(@Body() dto: CreateLeaveDto, @Request() req) {
        return this.leavesService.create(dto, Number(req.user.companyId));
    }

    @Put(':id/approve')
    @RequirePermission('leaves', 'approve')
    approve(@Param('id') id: string, @Request() req) {
        return this.leavesService.approve(parseInt(id), Number(req.user.companyId), Number(req.user.userId));
    }

    @Put(':id/reject')
    @RequirePermission('leaves', 'approve')
    reject(@Param('id') id: string, @Request() req) {
        return this.leavesService.reject(parseInt(id), Number(req.user.companyId));
    }

    @Post('balance')
    @RequirePermission('leaves', 'manage')
    createBalance(@Body() dto: CreateLeaveBalanceDto, @Request() req) {
        return this.leavesService.createBalance(dto, Number(req.user.companyId));
    }
}
