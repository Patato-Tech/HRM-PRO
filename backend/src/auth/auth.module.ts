import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({ secret: 'hrmpro_secret_key', signOptions: { expiresIn: '7d' } }),
        EmailModule,
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [JwtModule],
})
export class AuthModule { }