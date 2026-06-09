import { Controller, Post, Get, Put, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return this.authService.getProfile(req.user.userId, req.user.iat);
    }

    @UseGuards(JwtAuthGuard)
    @Put('profile')
    updateProfile(@Request() req, @Body() body: { name: string }) {
        return this.authService.updateProfile(req.user.userId, body.name);
    }

    @UseGuards(JwtAuthGuard)
    @Put('profile/password')
    updatePassword(@Request() req, @Body() body: { currentPassword: string; newPassword: string }) {
        return this.authService.updatePassword(req.user.userId, body.currentPassword, body.newPassword);
    }

    @UseGuards(JwtAuthGuard)
    @Get('company')
    getCompany(@Request() req) {
        return this.authService.getCompanyInfo(req.user.companyId);
    }
}
