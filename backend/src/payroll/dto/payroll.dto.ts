import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePayrollDto {
    @IsString()
    employeeId: string;

    @IsInt()
    month: number;

    @IsInt()
    year: number;

    @IsNumber()
    basic: number;

    @IsOptional()
    @IsNumber()
    allowances?: number;

    @IsOptional()
    @IsNumber()
    deductions?: number;
}

export class UpdatePayrollDto {
    @IsOptional()
    @IsNumber()
    basic?: number;

    @IsOptional()
    @IsNumber()
    allowances?: number;

    @IsOptional()
    @IsNumber()
    deductions?: number;

    @IsOptional()
    @IsString()
    status?: string;
}
