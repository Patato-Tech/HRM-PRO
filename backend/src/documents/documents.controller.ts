import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
    constructor(private documentsService: DocumentsService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.documentsService.findAll(Number(req.user.companyId), req.user);
    }

    @Get('employee/:id')
    findByEmployee(@Param('id') id: string, @Request() req: any) {
        return this.documentsService.findByEmployee(parseInt(id), Number(req.user.companyId));
    }

    @Post()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + extname(file.originalname));
            },
        }),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    }))
    create(@UploadedFile() file: Express.Multer.File, @Body() dto: any, @Request() req: any) {
        const url = file
            ? `${process.env.BASE_URL || 'http://localhost:5001'}/uploads/${file.filename}`
            : dto.url;
        return this.documentsService.create({ ...dto, url }, Number(req.user.companyId), req.user);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
        return this.documentsService.update(parseInt(id), dto, Number(req.user.companyId));
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.documentsService.remove(parseInt(id), Number(req.user.companyId));
    }
}
