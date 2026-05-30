import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlatformService } from './platform.service';
import { PlatformController } from './platform.controller';

@Module({
    imports: [
        JwtModule.register({ secret: 'hrmpro_secret_key', signOptions: { expiresIn: '7d' } }),
    ],
    providers: [PlatformService],
    controllers: [PlatformController],
})
export class PlatformModule { }
