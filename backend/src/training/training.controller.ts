import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { TrainingService } from './training.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('training')
export class TrainingController {
    constructor(private trainingService: TrainingService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.trainingService.findAll(Number(req.user.companyId), req.user);
    }

    @Post()
    create(@Body() dto: any, @Request() req: any) {
        return this.trainingService.create(dto, Number(req.user.companyId), req.user);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
        return this.trainingService.update(parseInt(id), dto, Number(req.user.companyId));
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.trainingService.remove(parseInt(id), Number(req.user.companyId));
    }

    @Post(':id/enroll')
    enroll(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
        return this.trainingService.enroll(parseInt(id), Number(dto.employeeId), Number(req.user.companyId));
    }

    @Put('enrollment/:id')
    updateEnrollment(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
        return this.trainingService.updateEnrollment(parseInt(id), dto, Number(req.user.companyId));
    }

    @Delete('enrollment/:id')
    removeEnrollment(@Param('id') id: string, @Request() req: any) {
        return this.trainingService.removeEnrollment(parseInt(id), Number(req.user.companyId));
    }
}
