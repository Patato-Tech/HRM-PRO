import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('recruitment')
export class RecruitmentController {
    constructor(private recruitmentService: RecruitmentService) { }

    @Get('jobs')
    findAllJobs(@Request() req: any) {
        return this.recruitmentService.findAllJobs(Number(req.user.companyId));
    }

    @Post('jobs')
    createJob(@Body() dto: any, @Request() req: any) {
        return this.recruitmentService.createJob(dto, Number(req.user.companyId), req.user);
    }

    @Put('jobs/:id')
    updateJob(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
        return this.recruitmentService.updateJob(parseInt(id), dto, Number(req.user.companyId));
    }

    @Delete('jobs/:id')
    removeJob(@Param('id') id: string, @Request() req: any) {
        return this.recruitmentService.removeJob(parseInt(id), Number(req.user.companyId));
    }

    @Get('jobs/:jobId/applicants')
    findApplicants(@Param('jobId') jobId: string, @Request() req: any) {
        return this.recruitmentService.findApplicants(parseInt(jobId), Number(req.user.companyId));
    }

    @Post('applicants')
    createApplicant(@Body() dto: any, @Request() req: any) {
        return this.recruitmentService.createApplicant(dto, Number(req.user.companyId));
    }

    @Put('applicants/:id')
    updateApplicant(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
        return this.recruitmentService.updateApplicant(parseInt(id), dto, Number(req.user.companyId));
    }

    @Delete('applicants/:id')
    removeApplicant(@Param('id') id: string, @Request() req: any) {
        return this.recruitmentService.removeApplicant(parseInt(id), Number(req.user.companyId));
    }
}
