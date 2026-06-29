import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { DepartmentsModule } from './departments/departments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeavesModule } from './leaves/leaves.module';
import { PayrollModule } from './payroll/payroll.module';
import { PlatformModule } from './platform/platform.module';
import { EmailModule } from './email/email.module';
import { PrismaModule } from './prisma/prisma.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsGuard } from './auth/permissions.guard';
import { PerformanceModule } from './performance/performance.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { TrainingModule } from './training/training.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    EmailModule,
    AuthModule,
    EmployeesModule,
    DepartmentsModule,
    AttendanceModule,
    LeavesModule,
    PayrollModule,
    PlatformModule,
    RolesModule,
    PerformanceModule,
    RecruitmentModule,
    TrainingModule,
    DocumentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule { }

