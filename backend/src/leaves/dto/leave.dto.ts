import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateLeaveDto {
    @IsString()
    employeeId: string;

    @IsString()
    leaveType: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsInt()
    days: number;

    @IsOptional()
    @IsString()
    reason?: string;
}

export class CreateLeaveBalanceDto {
    @IsString()
    employeeId: string;

    @IsString()
    leaveType: string;

    @IsInt()
    total: number;

    @IsInt()
    year: number;
}
