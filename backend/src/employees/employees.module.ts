import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [EmailModule],
    providers: [EmployeesService],
    controllers: [EmployeesController],
})
export class EmployeesModule { }