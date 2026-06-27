import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PayrollScheduler } from './payroll.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
@Module({
    imports: [PrismaModule],
    providers: [PayrollService, PayrollScheduler],
    controllers: [PayrollController],
})
export class PayrollModule { }
