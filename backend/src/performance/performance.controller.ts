import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('performance')
export class PerformanceController {
    constructor(private performanceService: PerformanceService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.performanceService.findAll(Number(req.user.companyId), req.user);
    }

    @Post()
    create(@Body() dto: any, @Request() req: any) {
        return this.performanceService.create(dto, Number(req.user.companyId), req.user);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
        return this.performanceService.update(parseInt(id), dto, Number(req.user.companyId));
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.performanceService.remove(parseInt(id), Number(req.user.companyId));
    }
}
