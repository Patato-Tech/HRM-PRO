import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  findAll(@Request() req) {
    return this.rolesService.findAll(Number(req.user.companyId));
  }

  @Get('default-permissions')
  getDefaultPermissions() {
    return this.rolesService.getDefaultPermissions();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.rolesService.findOne(parseInt(id), Number(req.user.companyId));
  }

  @Post()
  create(@Body() dto: { name: string; description?: string; scope?: string; permissions: any }, @Request() req) {
    if (req.user.role !== 'COMPANY_ADMIN') {
      return { error: 'Only Company Admin can manage roles' };
    }
    return this.rolesService.create(Number(req.user.companyId), dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any, @Request() req) {
    if (req.user.role !== 'COMPANY_ADMIN') {
      return { error: 'Only Company Admin can manage roles' };
    }
    return this.rolesService.update(parseInt(id), Number(req.user.companyId), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'COMPANY_ADMIN') {
      return { error: 'Only Company Admin can manage roles' };
    }
    return this.rolesService.remove(parseInt(id), Number(req.user.companyId));
  }
}
