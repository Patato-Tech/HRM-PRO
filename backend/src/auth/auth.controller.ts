import { Controller, Post, Get, Put, Body, Request, UseGuards, Query } from '@nestjs/common';
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
    updateProfile(@Request() req, @Body() body: { name: string; designation?: string; phone?: string; cnic?: string }) {
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

    @UseGuards(JwtAuthGuard)
    @Put('company')
    updateCompany(@Request() req, @Body() body: any) {
        return this.authService.updateCompanyInfo(req.user.companyId, body);
    }
    @Post('forgot-password')
    forgotPassword(@Body() body: { email: string }) {
        return this.authService.sendForgotPasswordOTP(body.email);
    }
    @Post('send-verification-otp')
    sendVerificationOTP(@Body() body: { email: string }) {
        return this.authService.sendVerificationOTP(body.email);
    }
    @Post('verify-otp')
    verifyOTP(@Body() body: { email: string; otp: string; newPassword: string }) {
        return this.authService.verifyForgotPasswordOTP(body.email, body.otp, body.newPassword);
    }
    @Post('activate-account')
    activateAccount(@Body() body: { email: string; otp: string }) {
        return this.authService.activateAccount(body.email, body.otp);
    }

    @Post('verify-email-otp')
    verifyEmailOTP(@Body() body: { email: string; otp: string }) {
        return this.authService.verifyEmailOTP(body.email, body.otp);
    }
    @Get('company-status')
    getCompanyStatus(@Query('email') email: string) {
        return this.authService.getCompanyStatusByEmail(email);
    }
}





