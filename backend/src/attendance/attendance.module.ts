import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { SettingsService } from './settings.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [AttendanceService, SettingsService],
    controllers: [AttendanceController],
    exports: [SettingsService],
})
export class AttendanceModule { }
